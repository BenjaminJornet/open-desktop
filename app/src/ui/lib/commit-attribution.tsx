import { Commit } from '../../models/commit'
import * as React from 'react'
import { GitHubRepository } from '../../models/github-repository'
import { getAvatarUsersForCommit, IAvatarUser } from '../../models/avatar'

interface ICommitAttributionProps {
  /**
   * The commit or commits from where to extract the author, committer
   * and co-authors from.
   */
  readonly commits: ReadonlyArray<Commit>

  /**
   * The GitHub hosted repository that the given commit is
   * associated with or null if repository is local or
   * not associated with a GitHub account. Used to determine
   * whether a commit is a special GitHub web flow user.
   */
  readonly gitHubRepository: GitHubRepository | null
}

/**
 * A component used for listing the authors involved in
 * a commit, formatting the content as close to what
 * GitHub.com does as possible.
 */
export class CommitAttribution extends React.Component<
  ICommitAttributionProps,
  {}
> {
  private renderAuthorInline(author: IAvatarUser) {
    return <span className="author">{author.name}</span>
  }

  private renderAuthors(authors: ReadonlyArray<IAvatarUser>) {
    if (authors.length === 1) {
      return (
        <span className="authors">{this.renderAuthorInline(authors[0])}</span>
      )
    } else if (authors.length === 2) {
      return (
        <span className="authors">
          {this.renderAuthorInline(authors[0])}
          {`, `}
          {this.renderAuthorInline(authors[1])}
        </span>
      )
    } else {
      return <span className="authors">{authors.length} people</span>
    }
  }

  public render() {
    const { commits, gitHubRepository } = this.props

    const allAuthors = commits.flatMap(x =>
      getAvatarUsersForCommit(gitHubRepository, x)
    )
    const uniqueAuthors = new Map<string, IAvatarUser>(
      allAuthors.map(a => [a.name + a.email, a])
    )

    return (
      <span className="commit-attribution-component">
        {this.renderAuthors(Array.from(uniqueAuthors.values()))}
      </span>
    )
  }
}
