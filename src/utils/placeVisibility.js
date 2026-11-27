export function filterVisiblePlaces(places, selectedGuest, showMineOnly) {
  return places.filter(
    (place) =>
      (!place.isPrivate || place.author === selectedGuest) &&
      (!showMineOnly || place.author === selectedGuest),
  );
}
