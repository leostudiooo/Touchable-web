// 为第三方库添加类型声明

declare module 'pressure' {
  interface PressureConfig {
    only?: string
    preventDefault?: boolean
    preventSelect?: boolean
  }

  interface PressureHandlers {
    start?: (event: MouseEvent | TouchEvent) => void
    change?: (force: number, event: MouseEvent | TouchEvent) => void
    end?: (event: MouseEvent | TouchEvent) => void
  }

  export function set(element: Element, handlers: PressureHandlers, config?: PressureConfig): void
}

declare module 'gamepad' {
  interface GamepadData {
    index: number
    id: string
    buttons: Array<{
      pressed: boolean
      value: number
    }>
    axes: number[]
  }

  export function connect(callback: (gamepad: GamepadData) => void): void
  export function disconnect(callback: (gamepad: GamepadData) => void): void
  export function update(callback: (gamepads: GamepadData[]) => void): void
}

declare module 'webmidi' {
  export interface MidiOutput {
    id: string
    name: string
    manufacturer: string
    sendControlChange(controller: number, value: number, channel?: number): void
  }

  export interface MidiInput {
    id: string
    name: string
    manufacturer: string
  }

  export interface MidiEvent {
    target: MidiInput | MidiOutput
  }

  export class WebMidi {
    static enable(callback?: (error?: Error) => void): void
    static disable(): void
    static outputs: MidiOutput[]
    static inputs: MidiInput[]
    static enabled: boolean
    static addListener(event: string, callback: (event: MidiEvent) => void): void
    static removeListener(event: string, callback: (event: MidiEvent) => void): void
  }
}
