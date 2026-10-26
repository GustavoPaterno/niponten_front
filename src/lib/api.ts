import {
    ComboResourceApi,
    IngredientResourceApi,
    ProductResourceApi,
    SizeResourceApi,
} from "nippon-ten";

import { configuration } from "@/src/lib/nippon";

// Instâncias do SDK por recurso. Só devem ser usadas em código que roda no navegador
// (componentes "use client").
export const api = {
    combo: new ComboResourceApi(configuration),
    ingredient: new IngredientResourceApi(configuration),
    product: new ProductResourceApi(configuration),
    size: new SizeResourceApi(configuration),
};
