"use client";

import { useEffect } from "react";
import { APIProvider, AdvancedMarker, Map as GoogleMap, useMap } from "@vis.gl/react-google-maps";

import type { Posicao } from "@/src/services/entrega";

// Chave de navegador, restrita ao domínio do front e à Maps JavaScript API. Não é a chave de
// Geocoding do backend.
const CHAVE = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
// O pino arrastável (AdvancedMarker) exige um Map ID. DEMO_MAP_ID serve para desenvolvimento.
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

// Sem a loja, o mapa abre no Brasil inteiro.
const BRASIL: Posicao = { lat: -14.235, lng: -51.925 };
const ZOOM_DA_RUA = 17;

export const mapaDisponivel = CHAVE !== "";

/** Leva o mapa até o pino quando ele muda de lugar fora do mapa (endereço, localização). */
function SeguirPino({ posicao }: { posicao: Posicao | null }) {
    const mapa = useMap();
    const lat = posicao?.lat;
    const lng = posicao?.lng;

    useEffect(() => {
        if (!mapa || lat === undefined || lng === undefined) {
            return;
        }

        mapa.panTo({ lat, lng });

        if ((mapa.getZoom() ?? 0) < 15) {
            mapa.setZoom(ZOOM_DA_RUA);
        }
    }, [mapa, lat, lng]);

    return null;
}

interface Props {
    posicao: Posicao | null;
    /** O admin clicou no mapa ou soltou o pino arrastado. */
    onMover: (posicao: Posicao) => void;
}

/** Mapa com o pino da loja. O pino é arrastável, e um clique no mapa o leva até lá. */
export default function MapaLoja({ posicao, onMover }: Props) {
    if (!mapaDisponivel) {
        return (
            <div className="flex h-72 items-center justify-center rounded-xl bg-black/5 px-6 text-center text-sm text-tinta-suave">
                Mapa indisponível: defina NEXT_PUBLIC_GOOGLE_MAPS_API_KEY no .env do front. A loja ainda pode
                ser salva pelo endereço.
            </div>
        );
    }

    return (
        <APIProvider apiKey={CHAVE} language="pt-BR" region="BR">
            <div className="h-72 overflow-hidden rounded-xl sm:h-96">
                <GoogleMap
                    mapId={MAP_ID}
                    defaultCenter={posicao ?? BRASIL}
                    defaultZoom={posicao ? ZOOM_DA_RUA : 4}
                    gestureHandling="greedy"
                    clickableIcons={false}
                    streetViewControl={false}
                    mapTypeControl={false}
                    onClick={(e) => {
                        if (e.detail.latLng) {
                            onMover(e.detail.latLng);
                        }
                    }}
                >
                    {posicao && (
                        <AdvancedMarker
                            position={posicao}
                            draggable
                            title="Loja (arraste para ajustar)"
                            onDragEnd={(e) => {
                                if (e.latLng) {
                                    onMover({ lat: e.latLng.lat(), lng: e.latLng.lng() });
                                }
                            }}
                        />
                    )}
                    <SeguirPino posicao={posicao} />
                </GoogleMap>
            </div>
        </APIProvider>
    );
}
