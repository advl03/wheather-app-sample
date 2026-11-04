export type City = {
  id: string;
  name: string;
  country?: string;
  latitude: number;
  longitude: number;
};

export type AppState = {
  cities: City[];
  defaultCityId: string | null;
  unit: "celsius";
};

export const emptyState = (): AppState => ({
  cities: [],
  defaultCityId: null,
  unit: "celsius",
});
