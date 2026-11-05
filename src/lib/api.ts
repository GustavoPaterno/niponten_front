import {
    ComboResourceApi,
    IngredientResourceApi,
    InternalResourceApi,
    InternalRoleResourceApi,
    OrderResourceApi,
    ProductResourceApi,
    PromotionResourceApi,
    SizeResourceApi,
    UserResourceApi,
} from "@joao.sumi/nippon-ten";

import { configuration } from "@/src/lib/nippon";

export const api = {
    combo: new ComboResourceApi(configuration),
    ingredient: new IngredientResourceApi(configuration),
    internal: new InternalResourceApi(configuration),
    internalRole: new InternalRoleResourceApi(configuration),
    order: new OrderResourceApi(configuration),
    product: new ProductResourceApi(configuration),
    promotion: new PromotionResourceApi(configuration),
    size: new SizeResourceApi(configuration),
    user: new UserResourceApi(configuration),
};
