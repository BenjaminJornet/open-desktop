import { describe, it, TestContext } from 'node:test'
import assert from 'node:assert'
import * as Path from 'path'
import { setupEmptyRepository } from '../../../helpers/repositories'
import { pull } from '../../../../src/lib/git'
import { IRemote } from '../../../../src/models/remote'
import { exec } from 'dugite'
import { Repository } from '../../../../src/models/repository'
import {
  cloneRepository,
  makeCommit,
} from '../../../helpers/repository-scaffolding'
import { rm } from 'fs/promises'
import { pathExists } from '../../../../src/ui/lib/path-exists'

async function setupRepositoryWithSubmodule(
  t: TestContext
): Promise<{ parent: Repository; submodule: Repository }> {
  const parent = await setupEmptyRepository(t)
  const submodule = await setupEmptyRepository(t)

  // Add commits to submodule
  await makeCommit(submodule, {
    commitMessage: 'Initial commit in submodule',
    entries: [{ path: 'submodule-file.txt', contents: 'hello from submodule' }],
  })

  await makeCommit(submodule, {
    commitMessage: 'Second commit in submodule',
    entries: [{ path: 'submodule-file.txt', contents: 'updated content' }],
  })

  // Add commits to parent
  await makeCommit(parent, {
    commitMessage: 'Initial commit in parent',
    entries: [{ path: 'README.md', contents: '# Parent repo' }],
  })

  // Add submodule to parent
  await exec(
    [
      '-c',
      'protocol.file.allow=always',
      'submodule',
      'add',
      submodule.path,
      'test-submodule',
    ],
    parent.path
  )

  await exec(['commit', '-m', 'Add submodule'], parent.path)

  return { parent, submodule }
}

describe('git/pull', () => {
  describe('with submodules', () => {
    it('initializes an uninitialized submodule when pulling from a remote with changes', async t => {
      // Setup: Create a parent repo with a submodule, then clone it
      const { parent } = await setupRepositoryWithSubmodule(t)

      // Clone the parent repository
      const cloned = await cloneRepository(t, parent)

      // Make a change in the parent (original) repo
      await makeCommit(parent, {
        commitMessage: 'Update README',
        entries: [{ path: 'README.md', contents: '# Updated Parent repo' }],
      })

      const remote: IRemote = {
        name: 'origin',
        url: parent.path,
      }

      // Deinitialize the submodule in the cloned repo
      const submodulePath = Path.join(cloned.path, 'test-submodule')
      await exec(['submodule', 'deinit', '-f', 'test-submodule'], cloned.path)

      // Remove the submodule directory
      await rm(submodulePath, { recursive: true, force: true })

      // Verify the submodule is not initialized
      const submoduleStatus = await exec(['submodule', 'status'], cloned.path)
      assert.ok(
        submoduleStatus.stdout.includes('-'),
        'Submodule should be uninitialized (starts with -)'
      )

      // Now pull with allowFileProtocol=true
      await pull(cloned, remote, undefined, true)

      // Verify the submodule is initialized and has the correct commits
      const submoduleGitPath = Path.join(submodulePath, '.git')

      // Check that submodule .git exists (either as file or directory)
      const submoduleGitExists = await pathExists(submoduleGitPath)
      assert.equal(
        submoduleGitExists,
        true,
        'Submodule .git should exist after pull'
      )

      // Verify submodule has two commits
      const submoduleLog = await exec(['log', '--oneline'], submodulePath)
      assert.equal(
        submoduleLog.stdout.trim().split('\n').length,
        2,
        'Submodule should have two commits'
      )
    })

    it('updates submodule references after pulling changes', async t => {
      // Setup: Create parent with submodule, clone it
      const { parent, submodule } = await setupRepositoryWithSubmodule(t)

      const cloned = await cloneRepository(t, parent)

      // Initialize submodules in the cloned repo
      await exec(
        ['-c', 'protocol.file.allow=always', 'submodule', 'update', '--init'],
        cloned.path
      )

      const submodulePath = Path.join(cloned.path, 'test-submodule')

      // Verify initial state
      const initialLog = await exec(['log', '--oneline'], submodulePath)
      const initialCommitCount = initialLog.stdout.trim().split('\n').length
      assert.equal(initialCommitCount, 2, 'Should start with 2 commits')

      // Add a new commit to the submodule
      await makeCommit(submodule, {
        commitMessage: 'Third commit in submodule',
        entries: [{ path: 'another-file.txt', contents: 'more content' }],
      })

      // Update the submodule reference in parent and commit
      await exec(
        ['-c', 'protocol.file.allow=always', 'submodule', 'update', '--remote'],
        parent.path
      )
      await exec(['add', 'test-submodule'], parent.path)
      await exec(['commit', '-m', 'Update submodule reference'], parent.path)

      const remote: IRemote = {
        name: 'origin',
        url: parent.path,
      }

      // Pull the changes
      await pull(cloned, remote, undefined, true)

      // Verify submodule was updated to the new reference
      const finalLog = await exec(['log', '--oneline'], submodulePath)
      const finalCommitCount = finalLog.stdout.trim().split('\n').length

      assert.equal(
        finalCommitCount,
        3,
        'Submodule should now have 3 commits after update'
      )
    })

    it('handles pull when there are no submodule changes', async t => {
      const { parent } = await setupRepositoryWithSubmodule(t)
      const cloned = await cloneRepository(t, parent)

      // Initialize submodules
      await exec(
        ['-c', 'protocol.file.allow=always', 'submodule', 'update', '--init'],
        cloned.path
      )

      // Make a change that doesn't affect submodules
      await makeCommit(parent, {
        commitMessage: 'Update README again',
        entries: [{ path: 'README.md', contents: '# Another update' }],
      })

      const remote: IRemote = {
        name: 'origin',
        url: parent.path,
      }

      const submodulePath = Path.join(cloned.path, 'test-submodule')
      const beforeLog = await exec(['log', '--oneline'], submodulePath)
      const beforeCount = beforeLog.stdout.trim().split('\n').length

      // Pull should succeed without errors
      await pull(cloned, remote, undefined, true)

      // Submodule should remain unchanged
      const afterLog = await exec(['log', '--oneline'], submodulePath)
      const afterCount = afterLog.stdout.trim().split('\n').length

      assert.equal(
        afterCount,
        beforeCount,
        'Submodule commits should remain unchanged'
      )
    })
  })
})
