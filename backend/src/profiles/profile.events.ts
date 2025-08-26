export interface ProfilesLookupRequested {
  eventId: string;
  riotName: string;
  tag: string;
  attempt: number;
}

export interface ProfilesLookupFailed {
  eventId: string;
  riotName: string;
  tag: string;
  reason: string;
}
