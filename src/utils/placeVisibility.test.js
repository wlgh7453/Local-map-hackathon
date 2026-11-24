import assert from 'node:assert/strict';
import test from 'node:test';
import { filterVisiblePlaces } from './placeVisibility.js';

const places = [
  { id: 'guest-1-public', author: '게스트 1', isPrivate: false },
  { id: 'guest-1-private', author: '게스트 1', isPrivate: true },
  { id: 'guest-2-public', author: '게스트 2', isPrivate: false },
  { id: 'guest-2-private', author: '게스트 2', isPrivate: true },
];

test('hides another guest’s private places but keeps public places visible', () => {
  const visible = filterVisiblePlaces(places, '게스트 1', false);

  assert.deepEqual(
    visible.map((place) => place.id),
    ['guest-1-public', 'guest-1-private', 'guest-2-public'],
  );
});

test('the backpack filter only shows the selected guest’s places', () => {
  const visible = filterVisiblePlaces(places, '게스트 2', true);

  assert.deepEqual(
    visible.map((place) => place.id),
    ['guest-2-public', 'guest-2-private'],
  );
});
