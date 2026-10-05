import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Navigation,
  Phone,
  Search,
  Building2,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Volume2,
  CheckCircle,
  PhoneCall,
  Info,
  AlertCircle,
} from 'lucide-react';
import { NearbyPlace, PlaceCategory } from '../types';
import { getPlaces } from '../utils/placesService';
import { speakText } from '../utils/speech';

export const NearMeView: React.FC = () => {
  const [gpsCoords, setGpsCoords] = useState<{
    lat?: number;
    lng?: number;
    accuracy?: number;
  }>({});
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isGpsInaccurate, setIsGpsInaccurate] = useState(false);
  const [showLocationExplainer, setShowLocationExplainer] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingText, setIsSearchingText] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<PlaceCategory | 'phones'>('all');
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [placesSource, setPlacesSource] = useState<string>('OpenStreetMap / Cadastro Oficial');
  const [callConfirmation, setCallConfirmation] = useState<{
    isOpen: boolean;
    placeName: string;
    phoneNumber: string;
  } | null>(null);

  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((result) => {
          if (result.state === 'granted') {
            executeGeolocationFetch();
          }
        })
        .catch(() => {});
    }
    loadPlaces(undefined, undefined, '', 'all');
  }, []);

  const loadPlaces = async (
    lat?: number,
    lng?: number,
    query?: string,
    category: PlaceCategory | 'phones' = selectedCategory
  ) => {
    if (category === 'phones') return;
    setIsLoadingPlaces(true);
    try {
      const res = await getPlaces({
        lat,
        lng,
        query: query?.trim() ? query.trim() : undefined,
        category: category as PlaceCategory,
      });
      setPlaces(res.places);
      setLocationName(res.resolvedLocationName || null);
      setPlacesSource(res.sourceDescription);
    } catch (err) {
      console.error('Erro ao carregar locais:', err);
    } finally {
      setIsLoadingPlaces(false);
    }
  };

  const handlePrimaryFindHelpClick = async () => {
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const perm = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        if (perm.state === 'granted') {
          executeGeolocationFetch();
          return;
        }
      } catch {}
    }

    const hasSeenExplainer = localStorage.getItem('vivaplus_seen_loc_explainer') === 'true';
    if (!hasSeenExplainer) {
      setShowLocationExplainer(true);
      speakText(
        'Para mostrar locais próximos, o VIVA+ precisa usar a localização deste aparelho. Toque em Autorizar e usar localização ou escolha digitar cidade ou endereço.'
      );
    } else {
      executeGeolocationFetch();
    }
  };

  const executeGeolocationFetch = () => {
    setShowLocationExplainer(false);
    localStorage.setItem('vivaplus_seen_loc_explainer', 'true');

    if (!navigator.geolocation) {
      setGpsError('Este aparelho ou navegador não possui suporte a GPS. Por favor, use a opção de digitar cidade ou endereço abaixo.');
      return;
    }

    setIsLocating(true);
    setGpsError(null);
    setIsGpsInaccurate(false);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;
        setGpsCoords({ lat, lng, accuracy });
        setIsLocating(false);

        if (accuracy > 1500) {
          setIsGpsInaccurate(true);
        }

        speakText('Localização identificada. Carregando unidades de saúde e farmácias próximas.');
        loadPlaces(lat, lng, searchQuery, selectedCategory);
      },
      (err) => {
        setIsLocating(false);
        let msg = 'Não foi possível obter sua localização no momento.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Permissão de localização não concedida. Você pode digitar sua cidade ou endereço abaixo.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'Sinal de GPS indisponível no momento. Você pode digitar sua cidade ou bairro abaixo.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'Tempo limite de espera do GPS esgotado. Tente novamente ou digite sua cidade abaixo.';
        }
        setGpsError(msg);
        speakText(msg);
      },
      { timeout: 12000, enableHighAccuracy: true, maximumAge: 60000 }
    );
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearchingText(true);
    speakText(`Buscando locais para ${searchQuery}`);
    loadPlaces(undefined, undefined, searchQuery.trim(), selectedCategory).finally(() => {
      setIsSearchingText(false);
    });
  };

  const handleSelectCategory = (cat: PlaceCategory | 'phones') => {
    setSelectedCategory(cat);
    if (cat !== 'phones') {
      loadPlaces(gpsCoords.lat, gpsCoords.lng, searchQuery, cat);
    }
  };

  const openRouteUrl = (place: NearbyPlace) => {
    const destination = encodeURIComponent(`${place.name}, ${place.address}`);
    if (gpsCoords.lat && gpsCoords.lng) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&origin=${gpsCoords.lat},${gpsCoords.lng}&destination=${place.lat},${place.lng}&travelmode=walking`,
        '_blank'
      );
    } else {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${destination}`,
        '_blank'
      );
    }
  };

  const emergencyPhones = [
    {
      name: 'SAMU (Urgência e Emergência)',
      number: '192',
      desc: 'Para infarto, AVC, dor no peito, falta de ar grave e acidentes com risco à vida.',
      color: 'bg-red-600',
    },
    {
      name: 'Bombeiros (Resgate e Acidentes)',
      number: '193',
      desc: 'Para quedas graves, fraturas, resgates, vazamentos e incêndios.',
      color: 'bg-orange-600',
    },
    {
      name: 'Disque Saúde SUS (Ministério da Saúde)',
      number: '136',
      desc: 'Informações oficiais sobre vacinas, medicamentos do SUS e ouvidoria.',
      color: 'bg-sky-600',
    },
    {
      name: 'Polícia Militar',
      number: '190',
      desc: 'Segurança pública imediata e situações de risco pessoal.',
      color: 'bg-slate-700',
    },
    {
      name: 'Disque Direitos Humanos e Proteção ao Idoso',
      number: '100',
      desc: 'Denúncias gratuitas de violações e apoio à pessoa idosa.',
      color: 'bg-indigo-600',
    },
  ];

  return (
    <div className="space-y-4 pb-28">
      {/* Header Info */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <MapPin className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                Ajuda perto de mim
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                Encontre postos de saúde (UBS), UPAs, hospitais e farmácias.
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              speakText(
                'Tela Ajuda perto de mim. Toque no botão grande Encontrar ajuda perto de mim para usar o GPS, ou digite sua cidade para ver postos de saúde, farmácias e telefones oficiais.'
              )
            }
            className="p-2 text-sky-600 hover:text-sky-800 rounded-xl"
            aria-label="Ouvir instruções da tela de ajuda perto de mim"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Find Help Action */}
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <button
            type="button"
            onClick={handlePrimaryFindHelpClick}
            disabled={isLocating}
            className="btn-contrast-solid w-full bg-sky-600 hover:bg-sky-700 active:scale-95 disabled:opacity-60 text-white font-black py-4 px-5 rounded-3xl flex items-center justify-center gap-3 text-base sm:text-lg shadow-lg transition"
            aria-label="Encontrar ajuda perto de mim usando localização deste aparelho"
          >
            {isLocating ? (
              <>
                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                <span>Consultando GPS do aparelho...</span>
              </>
            ) : (
              <>
                <Navigation className="w-6 h-6 shrink-0" />
                <span>Encontrar ajuda perto de mim</span>
              </>
            )}
          </button>

          {/* GPS Feedback */}
          {gpsCoords.lat && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl border-2 border-emerald-400 dark:border-emerald-700 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-xs font-black text-emerald-900 dark:text-emerald-200">
                    Localização deste aparelho ativa (GPS)
                  </p>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                    Precisão: ±{Math.round(gpsCoords.accuracy || 0)}m • Apenas para esta consulta
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={executeGeolocationFetch}
                className="text-xs font-bold text-sky-700 dark:text-sky-300 underline shrink-0 px-2 py-1"
              >
                Atualizar
              </button>
            </div>
          )}

          {isGpsInaccurate && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/60 rounded-2xl border-2 border-amber-400 dark:border-amber-700 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-black">Sinal de GPS com baixa precisão</strong>
                <span>
                  O sinal foi estimado em ±{Math.round(gpsCoords.accuracy || 0)} metros. Para ver locais mais exatos do seu bairro, use a opção Digitar cidade ou endereço logo abaixo.
                </span>
              </div>
            </div>
          )}

          {gpsError && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/60 rounded-2xl border-2 border-amber-400 dark:border-amber-700 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-black">Localização do aparelho:</strong>
                <p className="leading-relaxed">{gpsError}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 justify-center text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>O VIVA+ consulta sua posição apenas quando solicitado e não rastreia você em segundo plano.</span>
          </div>

          {/* Search Box */}
          <div className="pt-2">
            <form onSubmit={handleSearchSubmit} className="space-y-1.5">
              <label
                htmlFor="input-city-address"
                className="block text-xs font-black text-slate-800 dark:text-slate-200"
              >
                Ou digite sua cidade, bairro ou endereço:
              </label>
              <div className="flex gap-2">
                <input
                  id="input-city-address"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ex: Londrina Centro, Curitiba Batel ou São Paulo Sé"
                  className="flex-1 p-3 rounded-2xl border-2 border-slate-300 dark:border-slate-700 text-sm font-bold bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={isSearchingText || !searchQuery.trim()}
                  className="btn-contrast-solid bg-slate-900 dark:bg-white text-white dark:text-slate-900 disabled:opacity-50 px-4 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow"
                  aria-label="Buscar locais pelo endereço digitado"
                >
                  {isSearchingText ? (
                    <div className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Buscar</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Categories */}
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
          <span className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-2">
            Filtrar tipo de atendimento:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
            <button
              type="button"
              onClick={() => handleSelectCategory('all')}
              className={`py-2 px-2 text-xs font-black rounded-xl border-2 transition text-center ${
                selectedCategory === 'all'
                  ? 'btn-contrast-solid bg-sky-600 text-white border-sky-600 shadow'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
              }`}
            >
              Todos os Locais
            </button>
            <button
              type="button"
              onClick={() => handleSelectCategory('ubs')}
              className={`py-2 px-2 text-xs font-black rounded-xl border-2 transition text-center ${
                selectedCategory === 'ubs'
                  ? 'btn-contrast-solid bg-sky-600 text-white border-sky-600 shadow'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
              }`}
            >
              Postos UBS
            </button>
            <button
              type="button"
              onClick={() => handleSelectCategory('upa')}
              className={`py-2 px-2 text-xs font-black rounded-xl border-2 transition text-center ${
                selectedCategory === 'upa'
                  ? 'btn-contrast-solid bg-sky-600 text-white border-sky-600 shadow'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
              }`}
            >
              UPA 24 Horas
            </button>
            <button
              type="button"
              onClick={() => handleSelectCategory('hospital')}
              className={`py-2 px-2 text-xs font-black rounded-xl border-2 transition text-center ${
                selectedCategory === 'hospital'
                  ? 'btn-contrast-solid bg-sky-600 text-white border-sky-600 shadow'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
              }`}
            >
              Hospitais
            </button>
            <button
              type="button"
              onClick={() => handleSelectCategory('pharmacy')}
              className={`py-2 px-2 text-xs font-black rounded-xl border-2 transition text-center ${
                selectedCategory === 'pharmacy'
                  ? 'btn-contrast-solid bg-emerald-600 text-white border-emerald-600 shadow'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
              }`}
            >
              Farmácias
            </button>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleSelectCategory('phones')}
              className={`w-full py-2.5 px-3 text-xs font-black rounded-xl border-2 transition flex items-center justify-center gap-2 ${
                selectedCategory === 'phones'
                  ? 'btn-contrast-solid bg-red-600 text-white border-red-600 shadow'
                  : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
              }`}
            >
              <Phone className="w-4 h-4" />
              <span>Ver Telefones Oficiais Gratuitos (SAMU 192 e Bombeiros 193)</span>
            </button>
          </div>
        </div>
      </section>

      {/* Farmácia Popular Notice */}
      {selectedCategory === 'pharmacy' && (
        <section className="bg-amber-50 dark:bg-slate-900 rounded-3xl p-5 border-2 border-amber-400 dark:border-amber-600 space-y-2">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-black text-amber-950 dark:text-amber-200">
                Aviso importante sobre o Programa Farmácia Popular:
              </h3>
              <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
                Nem toda farmácia é credenciada. O VIVA+ <strong>não inventa credenciamento</strong>.
              </p>
              <p className="text-xs text-amber-950 dark:text-amber-100 font-black pt-1">
                Orientação segura: Ligue para a farmácia antes de sair de casa para confirmar convênio e estoque.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Places List */}
      {selectedCategory !== 'phones' && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">
                Locais encontrados ({places.length})
              </h3>
              {locationName && (
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Referência: {locationName}
                </p>
              )}
            </div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {placesSource}
            </span>
          </div>

          {isLoadingPlaces ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Consultando dados abertos de saúde e farmácias...
              </p>
            </div>
          ) : places.length === 0 ? (
            <div className="p-6 text-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200 dark:border-slate-800 space-y-3">
              <Building2 className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-sm font-black text-slate-900 dark:text-white">
                Nenhum local deste tipo encontrado para a busca informada.
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Tente digitar o nome da sua cidade ou selecionar outro tipo de atendimento acima.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {places.map((place) => {
                const isUpa = place.category === 'upa';
                const isHosp = place.category === 'hospital';
                const isPharm = place.category === 'pharmacy';

                return (
                  <article
                    key={place.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border-2 border-slate-300 dark:border-slate-700 space-y-3 transition hover:border-sky-500"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                            isUpa
                              ? 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200'
                              : isHosp
                              ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200'
                              : isPharm
                              ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
                              : 'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200'
                          }`}
                        >
                          {place.categoryLabel}
                        </span>
                        <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
                          {place.name}
                        </h4>
                      </div>
                      {place.formattedDistance && (
                        <span className="shrink-0 text-xs font-mono font-black text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950 px-2.5 py-1 rounded-xl border border-sky-200 dark:border-sky-800">
                          {place.formattedDistance}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-900 dark:text-white">Endereço: </strong>
                          <span>{place.address}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-1.5 pt-1">
                        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-900 dark:text-white">Horário: </strong>
                          <span>
                            {place.openingHours ? (
                              <span className="font-bold text-slate-900 dark:text-white">
                                {place.openingHours}
                              </span>
                            ) : (
                              <span className="text-slate-500 italic">
                                Horário não informado na base oficial
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-start gap-1.5 pt-1">
                        <Phone className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-900 dark:text-white">Telefone: </strong>
                          {place.phone ? (
                            <span className="font-mono font-black text-slate-900 dark:text-white">
                              {place.phone}
                            </span>
                          ) : (
                            <span className="text-slate-500 italic">
                              Telefone não informado na base oficial
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {place.phone ? (
                        <button
                          type="button"
                          onClick={() => {
                            setCallConfirmation({
                              isOpen: true,
                              placeName: place.name,
                              phoneNumber: place.phone!,
                            });
                          }}
                          className="btn-contrast-solid bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black py-3 px-4 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow"
                          aria-label={`Ligar para ${place.name}`}
                        >
                          <PhoneCall className="w-4 h-4" />
                          <span>Ligar para o local</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 cursor-not-allowed"
                        >
                          <Phone className="w-4 h-4 text-slate-400" />
                          <span>Telefone indisponível</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openRouteUrl(place)}
                        className="bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900/60 text-sky-900 dark:text-sky-200 font-black py-3 px-4 rounded-2xl text-xs sm:text-sm border-2 border-sky-300 dark:border-sky-700 flex items-center justify-center gap-2 transition"
                        aria-label={`Ver rota no mapa para ${place.name}`}
                      >
                        <ExternalLink className="w-4 h-4 text-sky-600" />
                        <span>Ver rota no mapa</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Emergency Phones */}
      {selectedCategory === 'phones' && (
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border-2 border-slate-300 dark:border-slate-700 space-y-3">
          <div className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-red-600" />
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Telefones Públicos Oficiais de Emergência (Brasil)
            </h3>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            Ligação gratuita em qualquer celular ou telefone fixo no Brasil, mesmo sem créditos ou sem chip.
          </p>
          <div className="space-y-2.5 pt-2">
            {emergencyPhones.map((ep, idx) => (
              <div
                key={idx}
                className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                      {ep.number}
                    </span>
                    <span className="text-sm font-black text-slate-800 dark:text-slate-200">
                      • {ep.name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {ep.desc}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCallConfirmation({
                      isOpen: true,
                      placeName: ep.name,
                      phoneNumber: ep.number,
                    });
                  }}
                  className={`btn-contrast-solid ${ep.color} hover:brightness-110 text-white font-black px-4 py-3 rounded-2xl flex items-center justify-center gap-2 text-xs sm:text-sm shrink-0 shadow transition`}
                  aria-label={`Ligar para ${ep.name} número ${ep.number}`}
                >
                  <Phone className="w-4 h-4" />
                  <span>Ligar {ep.number}</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Explainer Modal */}
      {showLocationExplainer && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="loc-dialog-title"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border-2 border-sky-400 dark:border-sky-600 shadow-2xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-300 flex items-center justify-center mx-auto shadow-inner">
              <MapPin className="w-7 h-7" />
            </div>
            <div className="text-center space-y-2">
              <h4
                id="loc-dialog-title"
                className="text-lg font-black text-slate-900 dark:text-white leading-snug"
              >
                Permissão de Localização
              </h4>
              <p className="text-sm text-slate-800 dark:text-slate-200 font-bold leading-relaxed">
                “Para mostrar locais próximos, o VIVA+ precisa usar a localização deste aparelho.”
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-1">
                Ao tocar no botão abaixo, seu navegador solicitará a autorização padrão do sistema. O VIVA+ usará apenas uma vez para calcular a distância dos postos de saúde e farmácias mais perto.
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={executeGeolocationFetch}
                className="btn-contrast-solid w-full bg-sky-600 hover:bg-sky-700 text-white font-black py-3.5 px-4 rounded-2xl text-sm shadow-md flex items-center justify-center gap-2"
              >
                <Navigation className="w-5 h-5" />
                <span>Autorizar e usar localização</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLocationExplainer(false);
                  localStorage.setItem('vivaplus_seen_loc_explainer', 'true');
                  const inputEl = document.getElementById('input-city-address');
                  inputEl?.focus();
                  speakText('Você pode digitar sua cidade ou endereço no campo de busca.');
                }}
                className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold py-3 px-4 rounded-2xl text-xs sm:text-sm border border-slate-300 dark:border-slate-700"
              >
                Prefiro digitar cidade ou endereço
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Call Confirmation Modal */}
      {callConfirmation && callConfirmation.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="call-dialog-title"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border-2 border-emerald-500 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h4
                id="call-dialog-title"
                className="text-base font-black text-slate-900 dark:text-white"
              >
                Confirmar chamada telefônica
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Você está prestes a discar para:
              </p>
              <p className="text-sm font-black text-slate-900 dark:text-white">
                {callConfirmation.placeName}
              </p>
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-700 my-2">
                <span className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-400 tracking-wider">
                  {callConfirmation.phoneNumber}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                O aplicativo abrirá o discador do seu telefone com este número.
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <a
                href={`tel:${callConfirmation.phoneNumber.replace(/[^\d+]/g, '')}`}
                onClick={() => setCallConfirmation(null)}
                className="btn-contrast-solid w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 shadow"
              >
                <Phone className="w-4 h-4" />
                <span>Sim, discar agora</span>
              </a>
              <button
                type="button"
                onClick={() => setCallConfirmation(null)}
                className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold py-2.5 rounded-2xl text-xs"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
