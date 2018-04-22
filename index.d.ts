declare namespace EventLayer {}

declare class EventLayer {
    constructor();

    identify<T>(userId: string, userProperties?: T): void;
    track<T>(eventName: string, eventProperties?: T): void;
    page<T>(category: string, name: string, properties?: T): void;
    alias(userId: string, previousId?: string): void;
    group<T>(groupId: string, traits?: T): void;
    fbTrack<T>(eventName: string, eventProperties?: T): void;
}

export = EventLayer;
