import { DeliveryDiningOutlined, RestaurantOutlined, StorefrontOutlined } from "@mui/icons-material";

import type { TipoEntregaCliente } from "@/src/services/checkout";

/** Rótulos dos pedidos do cliente, usados em "Meus pedidos" e na tela de pagamento. */

export const ICONE_TIPO = {
    DELIVERY: DeliveryDiningOutlined,
    PICKUP: StorefrontOutlined,
    DINE_IN: RestaurantOutlined,
} as const;

export const NOME_TIPO: Record<TipoEntregaCliente, string> = {
    DELIVERY: "Delivery",
    PICKUP: "Retirada",
    DINE_IN: "No local",
};

/** Dia e hora curtos, como "26/11, 12:35". */
export function data(iso: string): string {
    return iso
        ? new Date(iso).toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
          })
        : "";
}
