import 'mapbox-gl/dist/mapbox-gl.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Map, { Layer, Marker, Source } from 'react-map-gl/mapbox';
import { Camera, Moon, Plus, Sun, X } from 'lucide-react';
import './App.css';
import { translateTexts } from './utils/flittoApi.js';
import { filterVisiblePlaces } from './utils/placeVisibility.js';

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const INITIAL_VIEW_STATE = {
  longitude: 127.0552,
  latitude: 37.5448,
  zoom: 15.5,
  pitch: 50,
  bearing: -15,
};

const CATEGORY_COLORS = {
  카페: '#EF4444',
  음식점: '#F97316',
  '오락/취미': '#EAB308',
  야외: '#22C55E',
};

const LANGUAGES = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'zh-CN', label: '中文' },
  { code: 'ja', label: '日本語' },
];

const INITIAL_SPOTS = [
  {
    id: 'seongsu-cafe',
    name: '연무장길 작은 카페',
    category: '카페',
    position: [37.5448, 127.0552],
    intro: '골목 안쪽에 자리한 조용한 로스터리 카페예요.',
    tip: '창가 자리는 오후 햇살이 예뻐요.',
    photo:
      'https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=1000&q=85',
    author: '게스트 1',
    isPrivate: false,
  },
  {
    id: 'hyehwa-food',
    name: '혜화 골목 분식집',
    category: '음식점',
    position: [37.5822, 127.0015],
    intro: '대학로 산책 전에 들르기 좋은 작은 분식집이에요.',
    tip: '매콤한 떡볶이와 김말이를 함께 주문해 보세요.',
    photo:
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=85',
    author: '게스트 2',
    isPrivate: false,
  },
  {
    id: 'seongsu-shop',
    name: '성수 소품 상점',
    category: '오락/취미',
    position: [37.5454, 127.059],
    intro: '작가들의 문구와 작은 생활 소품을 구경할 수 있어요.',
    tip: '주말에는 인기 상품이 일찍 품절될 수 있어요.',
    photo:
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1000&q=85',
    author: '게스트 1',
    isPrivate: true,
  },
  {
    id: 'seoul-forest',
    name: '서울숲 피크닉 잔디밭',
    category: '야외',
    position: [37.5446, 127.0375],
    intro: '나무 그늘 아래 쉬어가기 좋은 서울숲의 잔디 공간이에요.',
    tip: '돗자리를 챙기고 해 질 무렵 산책해 보세요.',
    photo:
      'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1000&q=85',
    author: '게스트 2',
    isPrivate: false,
  },
];

const COURSES = [
  {
    id: 'seongsu-afternoon',
    name: '성수 오후 산책 코스',
    position: [37.545, 127.0538],
    author: '게스트 1',
    isPrivate: false,
    stops: [
      {
        id: 'course-cafe',
        name: '성수 로스터리 정류장',
        category: '카페',
        position: [37.5448, 127.0552],
        intro: '산책을 시작하기 좋은 코스의 첫 번째 카페예요.',
        tip: '테이크아웃해서 다음 장소까지 걸어가 보세요.',
        photo:
          'https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=1000&q=85',
        author: '게스트 1',
        isPrivate: false,
      },
      {
        id: 'course-shop',
        name: '골목 소품 공방',
        category: '오락/취미',
        position: [37.5454, 127.059],
        intro: '작은 공방과 소품 가게가 모여 있는 경유지예요.',
        tip: '골목 안쪽까지 천천히 구경해 보세요.',
        photo:
          'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1000&q=85',
        author: '게스트 1',
        isPrivate: false,
      },
      {
        id: 'course-forest',
        name: '서울숲 산책길',
        category: '야외',
        position: [37.5446, 127.0375],
        intro: '나무 그늘을 따라 걸으며 쉬어갈 수 있는 마지막 경유지예요.',
        tip: '해 질 무렵 산책하면 풍경이 특히 좋아요.',
        photo:
          'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1000&q=85',
        author: '게스트 1',
        isPrivate: false,
      },
    ],
  },
];

function MapMarkers({
  spots,
  courses,
  activeCourseStops,
  activeCourseId,
  onPlaceSelect,
  onCourseSelect,
}) {
  const placeMarker = (place) => (
    <Marker
      key={place.id}
      latitude={place.position[0]}
      longitude={place.position[1]}
      anchor="center"
    >
      <button
        className="mapbox-marker-button"
        type="button"
        aria-label={`${place.name} 장소 상세 보기`}
        onClick={(event) => {
          event.stopPropagation();
          onPlaceSelect(place, { x: event.clientX, y: event.clientY });
        }}
      >
        <span
          className="category-pin"
          style={{ '--pin-color': CATEGORY_COLORS[place.category] }}
        />
      </button>
    </Marker>
  );

  return (
    <>
      {spots.map(placeMarker)}
      {courses.map((course) => (
        <Marker
          key={course.id}
          latitude={course.position[0]}
          longitude={course.position[1]}
          anchor="center"
        >
          <button
            className="mapbox-marker-button course-marker-button"
            type="button"
            aria-label={`${course.name} 경로 ${activeCourseId === course.id ? '숨기기' : '보기'}`}
            aria-pressed={activeCourseId === course.id}
            onClick={(event) => {
              event.stopPropagation();
              onCourseSelect(course.id);
            }}
          >
            <span className="course-pin" />
          </button>
        </Marker>
      ))}
      {activeCourseStops.map(placeMarker)}
    </>
  );
}

export default function App() {
  const [isNight, setIsNight] = useState(false);
  const [showMineOnly, setShowMineOnly] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState('게스트 1');
  const [languageIndex, setLanguageIndex] = useState(0);
  const [activeCourseId, setActiveCourseId] = useState(null);
  const [spots, setSpots] = useState(INITIAL_SPOTS);
  const [activePlace, setActivePlace] = useState(null);
  const [avatarPosition, setAvatarPosition] = useState(null);
  const [translatedDetails, setTranslatedDetails] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [mapCenter, setMapCenter] = useState([
    INITIAL_VIEW_STATE.latitude,
    INITIAL_VIEW_STATE.longitude,
  ]);
  const [recordPosition, setRecordPosition] = useState(null);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [recordForm, setRecordForm] = useState({
    name: '',
    category: '카페',
    intro: '',
    tip: '',
    isPrivate: false,
  });
  const [photoUrl, setPhotoUrl] = useState('');
  const motionTimeout = useRef(null);
  const draftPhotoUrl = useRef(null);
  const createdPhotoUrls = useRef(new Set());
  const language = LANGUAGES[languageIndex];

  const visibleSpots = useMemo(
    () => filterVisiblePlaces(spots, selectedGuest, showMineOnly),
    [selectedGuest, showMineOnly, spots],
  );
  const visibleCourses = useMemo(
    () => filterVisiblePlaces(COURSES, selectedGuest, showMineOnly),
    [selectedGuest, showMineOnly],
  );
  const activeCourse =
    visibleCourses.find((course) => course.id === activeCourseId) ?? null;
  const activeCourseStops = useMemo(
    () =>
      activeCourse
        ? filterVisiblePlaces(activeCourse.stops, selectedGuest, showMineOnly)
        : [],
    [activeCourse, selectedGuest, showMineOnly],
  );
  const courseRouteCoordinates = useMemo(
    () =>
      activeCourse
        ? [
            activeCourse.position,
            ...activeCourseStops.map((stop) => stop.position),
          ]
        : [],
    [activeCourse, activeCourseStops],
  );
  const courseRoute = useMemo(
    () => ({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: courseRouteCoordinates.map(([latitude, longitude]) => [
          longitude,
          latitude,
        ]),
      },
    }),
    [courseRouteCoordinates],
  );

  const handleMapMoveEnd = useCallback(({ viewState }) => {
    setMapCenter([viewState.latitude, viewState.longitude]);
  }, []);

  const releaseDraftPhoto = () => {
    if (draftPhotoUrl.current) {
      URL.revokeObjectURL(draftPhotoUrl.current);
      createdPhotoUrls.current.delete(draftPhotoUrl.current);
      draftPhotoUrl.current = null;
    }
    setPhotoUrl('');
  };

  const openRecordModal = (position) => {
    releaseDraftPhoto();
    setRecordPosition(position);
    setRecordForm({
      name: '',
      category: '카페',
      intro: '',
      tip: '',
      isPrivate: false,
    });
    setShowRecordModal(true);
  };

  const closeRecordModal = () => {
    releaseDraftPhoto();
    setShowRecordModal(false);
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    releaseDraftPhoto();
    const nextPhotoUrl = URL.createObjectURL(file);
    draftPhotoUrl.current = nextPhotoUrl;
    createdPhotoUrls.current.add(nextPhotoUrl);
    setPhotoUrl(nextPhotoUrl);
  };

  const handleRecordSubmit = (event) => {
    event.preventDefault();
    const name = recordForm.name.trim();
    if (!name || !recordPosition) {
      return;
    }

    setSpots((currentSpots) => [
      ...currentSpots,
      {
        id: `place-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        category: recordForm.category,
        position: recordPosition,
        intro: recordForm.intro.trim(),
        tip: recordForm.tip.trim(),
        photo: photoUrl || null,
        author: selectedGuest,
        isPrivate: recordForm.isPrivate,
      },
    ]);
    draftPhotoUrl.current = null;
    setPhotoUrl('');
    setShowRecordModal(false);
  };

  const handlePlaceSelect = useCallback((place, point) => {
    if (motionTimeout.current) {
      clearTimeout(motionTimeout.current);
    }

    setActivePlace(null);
    setAvatarPosition({
      left: Math.max(34, Math.min(window.innerWidth - 34, point.x)),
      top: Math.max(42, Math.min(window.innerHeight - 42, point.y)),
    });
    motionTimeout.current = setTimeout(() => {
      setActivePlace(place);
      motionTimeout.current = null;
    }, 650);
  }, []);

  const closePlaceCard = () => {
    if (motionTimeout.current) {
      clearTimeout(motionTimeout.current);
      motionTimeout.current = null;
    }
    setActivePlace(null);
    setAvatarPosition(null);
  };

  const handleGuestChange = (event) => {
    const nextGuest = event.target.value;
    setSelectedGuest(nextGuest);

    if (
      activePlace &&
      ((activePlace.isPrivate && activePlace.author !== nextGuest) ||
        (showMineOnly && activePlace.author !== nextGuest))
    ) {
      closePlaceCard();
    }

    if (
      showMineOnly &&
      activeCourse &&
      activeCourse.author !== nextGuest
    ) {
      setActiveCourseId(null);
    }
  };

  useEffect(
    () => () => {
      if (motionTimeout.current) {
        clearTimeout(motionTimeout.current);
      }
      createdPhotoUrls.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );

  useEffect(() => {
    if (!activePlace) {
      setTranslatedDetails(null);
      setIsTranslating(false);
      return undefined;
    }

    let cancelled = false;
    setTranslatedDetails(null);
    setIsTranslating(language.code !== 'ko');

    translateTexts(
      [activePlace.name, activePlace.intro, activePlace.tip],
      language.code,
    ).then(([name, intro, tip]) => {
      if (!cancelled) {
        setTranslatedDetails({
          placeId: activePlace.id,
          language: language.code,
          name: name ?? activePlace.name,
          intro: intro ?? activePlace.intro,
          tip: tip ?? activePlace.tip,
        });
        setIsTranslating(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [activePlace, language.code]);

  const currentDetails =
    translatedDetails?.placeId === activePlace?.id &&
    translatedDetails?.language === language.code
      ? translatedDetails
      : activePlace;

  return (
    <main className="travel-map-app">
      <Map
        className={`travel-map ${isNight ? 'travel-map--night' : 'travel-map--day'}`}
        mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
        mapStyle={
          isNight
            ? 'mapbox://styles/mapbox/navigation-night-v1'
            : 'mapbox://styles/mapbox/outdoors-v12'
        }
        initialViewState={INITIAL_VIEW_STATE}
        onClick={(event) =>
          openRecordModal([event.lngLat.lat, event.lngLat.lng])
        }
        onMoveEnd={handleMapMoveEnd}
      >
        <MapMarkers
          spots={visibleSpots}
          courses={visibleCourses}
          activeCourseStops={activeCourseStops}
          activeCourseId={activeCourseId}
          onPlaceSelect={handlePlaceSelect}
          onCourseSelect={(id) =>
            setActiveCourseId((current) => (current === id ? null : id))
          }
        />
        {activeCourse && courseRouteCoordinates.length > 1 && (
          <Source
            id="active-course-route"
            type="geojson"
            data={courseRoute}
            lineMetrics
          >
            <Layer
              id="active-course-neon-glow"
              type="line"
              layout={{
                'line-cap': 'round',
                'line-join': 'round',
              }}
              paint={{
                'line-color': '#a855f7',
                'line-width': 12,
                'line-blur': 7,
                'line-opacity': 0.7,
              }}
            />
            <Layer
              id="active-course-rainbow-line"
              type="line"
              layout={{
                'line-cap': 'round',
                'line-join': 'round',
              }}
              paint={{
                'line-gradient': [
                  'interpolate',
                  ['linear'],
                  ['line-progress'],
                  0,
                  '#ff4d9d',
                  0.3,
                  '#ffb52e',
                  0.58,
                  '#8dff65',
                  0.8,
                  '#36e6ff',
                  1,
                  '#b66bff',
                ],
                'line-width': 5,
                'line-opacity': 0.98,
              }}
            />
          </Source>
        )}
      </Map>

      <header className="map-topbar">
        <div className="map-brand">
          <span className="map-brand__mark">✦</span>
          <span>오늘의 지도</span>
        </div>
        <button
          className="theme-toggle"
          type="button"
          onClick={() => setIsNight((night) => !night)}
          aria-label={isNight ? '낮 테마로 전환' : '밤 테마로 전환'}
        >
          {isNight ? <Sun size={17} /> : <Moon size={17} />}
          <span>{isNight ? '낮' : '밤'}</span>
        </button>
        <label className="guest-selector">
          <span className="guest-selector__avatar" aria-hidden="true">
            👤
          </span>
          <select
            value={selectedGuest}
            onChange={handleGuestChange}
            aria-label="현재 게스트 선택"
          >
            <option value="게스트 1">게스트 1</option>
            <option value="게스트 2">게스트 2</option>
          </select>
        </label>
      </header>

      <div
        className="floating-actions"
        role="group"
        aria-label="지도 필터 및 언어"
      >
        <button
          className={`floating-button backpack-button${showMineOnly ? ' is-active' : ''}`}
          type="button"
          onClick={() => {
            setShowMineOnly((show) => !show);
            if (!showMineOnly) {
              setActiveCourseId(null);
              if (activePlace && activePlace.author !== selectedGuest) {
                closePlaceCard();
              }
            }
          }}
          aria-label={showMineOnly ? '모든 기록 보기' : '내 기록만 보기'}
          aria-pressed={showMineOnly}
          title={showMineOnly ? '모든 기록' : '내 기록만'}
        >
          🎒
        </button>
        <button
          className="floating-button language-button"
          type="button"
          onClick={() =>
            setLanguageIndex((index) => (index + 1) % LANGUAGES.length)
          }
          aria-label={`언어 변경, 현재 ${language.label}`}
          title={`언어: ${language.label}`}
        >
          {language.code === 'zh-CN' ? '中' : language.code.toUpperCase()}
        </button>
      </div>

      {!activePlace && !showRecordModal && (
        <button
          className="add-record-button"
          type="button"
          onClick={() => openRecordModal(mapCenter)}
        >
          <Plus size={18} />
          <span>일상 기록하기</span>
        </button>
      )}

      <div
        className="traveler-avatar"
        style={
          avatarPosition
            ? { left: avatarPosition.left, top: avatarPosition.top }
            : undefined
        }
        aria-label="내 캐릭터"
        role="img"
      >
        🧑🏻‍🚀
      </div>

      {showRecordModal && recordPosition && (
        <div
          className="record-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeRecordModal();
            }
          }}
        >
          <section
            className="record-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="record-modal-title"
          >
            <header className="record-modal__header">
              <div>
                <span className="record-modal__eyebrow">MY TRAVEL LOG</span>
                <h2 id="record-modal-title">새로운 일상 기록</h2>
              </div>
              <button
                className="record-modal__close"
                type="button"
                onClick={closeRecordModal}
                aria-label="기록 작성 취소"
              >
                <X size={19} />
              </button>
            </header>

            <form className="record-form" onSubmit={handleRecordSubmit}>
              <div className="record-location">
                <span className="record-location__pin">⌖</span>
                <div>
                  <strong>지도에서 선택한 위치</strong>
                  <span>
                    위도 {recordPosition[0].toFixed(5)} · 경도{' '}
                    {recordPosition[1].toFixed(5)}
                  </span>
                </div>
              </div>

              <label className="record-field">
                <span>장소 이름</span>
                <input
                  autoFocus
                  required
                  maxLength={60}
                  value={recordForm.name}
                  onChange={(event) =>
                    setRecordForm((form) => ({
                      ...form,
                      name: event.target.value,
                    }))
                  }
                  placeholder="예: 성수동 작은 카페"
                />
              </label>

              <fieldset className="record-field record-category-field">
                <legend>카테고리</legend>
                <div className="record-category-options">
                  {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
                    <button
                      key={category}
                      className={`record-category-option${recordForm.category === category ? ' is-selected' : ''}`}
                      type="button"
                      onClick={() =>
                        setRecordForm((form) => ({ ...form, category }))
                      }
                      aria-pressed={recordForm.category === category}
                    >
                      <span style={{ backgroundColor: color }} />
                      {category === '오락/취미' ? '오락·취미' : category}
                    </button>
                  ))}
                </div>
              </fieldset>

              <label className="record-field">
                <span>사진</span>
                <span className="record-photo-picker">
                  {photoUrl ? (
                    <img src={photoUrl} alt="업로드한 사진 미리보기" />
                  ) : (
                    <span className="record-photo-picker__empty">
                      <Camera size={20} />
                      <span>사진 파일 선택</span>
                    </span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    aria-label="장소 사진 파일 업로드"
                  />
                </span>
              </label>

              <label className="record-field">
                <span>장소 소개</span>
                <textarea
                  rows={2}
                  maxLength={240}
                  value={recordForm.intro}
                  onChange={(event) =>
                    setRecordForm((form) => ({
                      ...form,
                      intro: event.target.value,
                    }))
                  }
                  placeholder="이곳에서의 기억을 남겨보세요."
                />
              </label>

              <label className="record-field">
                <span>꿀팁</span>
                <textarea
                  rows={2}
                  maxLength={160}
                  value={recordForm.tip}
                  onChange={(event) =>
                    setRecordForm((form) => ({
                      ...form,
                      tip: event.target.value,
                    }))
                  }
                  placeholder="다음 방문자를 위한 팁을 적어주세요."
                />
              </label>

              <div className="record-privacy">
                <div>
                  <strong>{recordForm.isPrivate ? '비공개 기록' : '공개 기록'}</strong>
                  <span>
                    {recordForm.isPrivate
                      ? '현재 선택한 게스트만 이 기록을 볼 수 있어요.'
                      : '모든 게스트가 이 기록을 볼 수 있어요.'}
                  </span>
                </div>
                <button
                  className={`privacy-switch${recordForm.isPrivate ? '' : ' is-on'}`}
                  type="button"
                  role="switch"
                  aria-checked={!recordForm.isPrivate}
                  aria-label="기록 공개 여부"
                  onClick={() =>
                    setRecordForm((form) => ({
                      ...form,
                      isPrivate: !form.isPrivate,
                    }))
                  }
                >
                  <span />
                </button>
              </div>

              <div className="record-form__actions">
                <button
                  className="record-cancel-button"
                  type="button"
                  onClick={closeRecordModal}
                >
                  취소
                </button>
                <button
                  className="record-save-button"
                  type="submit"
                  disabled={!recordForm.name.trim()}
                >
                  지도에 기록 저장
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {activePlace && (
        <section
          className="place-card"
          aria-label={`${activePlace.name} 상세 정보`}
          aria-live="polite"
        >
          {activePlace.photo && (
            <img className="place-card__photo" src={activePlace.photo} alt="" />
          )}
          <button
            className="place-card__close"
            type="button"
            onClick={closePlaceCard}
            aria-label="상세 카드 닫기"
          >
            <X size={18} />
          </button>
          <div className="place-card__content">
            <div className="place-card__eyebrow">
              <span
                className="category-dot"
                style={{ backgroundColor: CATEGORY_COLORS[activePlace.category] }}
              />
              <span>{activePlace.category}</span>
              <span
                className={`visibility-badge${activePlace.isPrivate ? ' is-private' : ''}`}
              >
                {activePlace.isPrivate ? '비공개' : '공개'}
              </span>
            </div>
            <h1>{currentDetails?.name ?? activePlace.name}</h1>
            <p>{currentDetails?.intro ?? activePlace.intro}</p>
            <p className="place-card__tip">
              <span aria-hidden="true">💡</span>{' '}
              {currentDetails?.tip ?? activePlace.tip}
            </p>
            {isTranslating && (
              <span className="translation-status">번역 중…</span>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
