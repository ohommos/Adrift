export type RootStackParamList = {
  Home: undefined;
  Planet: undefined;
  Dive: { cityId: string };
  City: { cityId: string };
  Tracker: { bottleId: string; from: "Home" | "Planet" };
  Compose: undefined;
  Scope: undefined;
  Sent: { scope: "city" | "global"; cityName?: string };
  Inbox: undefined;
  Read: { bottleId: string };
  Fate: { bottleId: string; kind: "break" | "pass" };
  Reply: { bottleId: string };
  ReplySent: undefined;
  Profile: undefined;
};
