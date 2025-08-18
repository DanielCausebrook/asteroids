
export function delayMs(ms: number): Promise<void> {
    return new Promise<void>(resolve => setTimeout(resolve, ms));
}
