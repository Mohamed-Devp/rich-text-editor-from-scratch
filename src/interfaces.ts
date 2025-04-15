export interface Component {
    content: string
    applied: string[]
}

export interface Line {
    components: Component[]
    applied: string[]
}
