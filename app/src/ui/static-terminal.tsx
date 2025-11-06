import {
  ITerminalOptions,
  ITerminalInitOnlyOptions,
  Terminal,
} from '@xterm/xterm'
import React from 'react'
import { getMonospaceFontFamily } from './get-monospace-font-family'

export const defaultTerminalOptions: Readonly<ITerminalOptions> = {
  convertEol: true,
  fontFamily: getMonospaceFontFamily(),
  fontSize: 12,
  screenReaderMode: true,
}

export type StaticTerminalProps = ITerminalOptions &
  ITerminalInitOnlyOptions & {
    readonly terminalOutput: string
    readonly hideCursor?: boolean
  }

export class StaticTerminal extends React.Component<StaticTerminalProps> {
  private terminalRef = React.createRef<HTMLDivElement>()
  private terminal: Terminal | null = null

  public componentDidMount() {
    const { terminalOutput, ...initOpts } = this.props
    this.terminal = new Terminal({
      ...defaultTerminalOptions,
      ...initOpts,

      rows: this.props.rows ?? 20,
      cols: this.props.cols ?? 80,
    })

    this.terminal.onKey(({ key, domEvent }) => {
      if (domEvent.key === 'ArrowUp' || domEvent.key === 'ArrowDown') {
        this.terminal?.scrollLines(domEvent.key === 'ArrowUp' ? -1 : 1)
        return
      }
    })

    if (this.terminalRef.current) {
      this.terminal.open(this.terminalRef.current)

      if (this.terminal.textarea) {
        this.terminal.textarea.disabled = true
      }

      if (this.props.hideCursor !== false) {
        this.terminal.write('\x1b[?25l') // hide cursor
        this.terminal.write(terminalOutput.trimEnd())
      }
    }
  }

  public render() {
    return <div ref={this.terminalRef} className="static-terminal"></div>
  }
}
