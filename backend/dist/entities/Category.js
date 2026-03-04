var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
export var CategoriaTipo;
(function (CategoriaTipo) {
    CategoriaTipo["ESPRESSO"] = "ESPRESSO";
    CategoriaTipo["AMERICANO"] = "AMERICANO";
    CategoriaTipo["CAPPUCCINO"] = "CAPPUCCINO";
    CategoriaTipo["LATTE"] = "LATTE";
    CategoriaTipo["MOCHA"] = "MOCHA";
    CategoriaTipo["FLAT_WHITE"] = "FLAT_WHITE";
    CategoriaTipo["MACCHIATO"] = "MACCHIATO";
    CategoriaTipo["COLD_BREW"] = "COLD_BREW";
    CategoriaTipo["AFFOGATO"] = "AFFOGATO";
    CategoriaTipo["PIZZA"] = "PIZZA";
    CategoriaTipo["SUSHI"] = "SUSHI";
    CategoriaTipo["HAMBURGUESAS"] = "HAMBURGUESAS";
    CategoriaTipo["PASTAS"] = "PASTAS";
    CategoriaTipo["COMIDA_MEXICANA"] = "COMIDA_MEXICANA";
    CategoriaTipo["COMIDA_CHINA"] = "COMIDA_CHINA";
    CategoriaTipo["COMIDA_INDIAN"] = "COMIDA_INDIAN";
    CategoriaTipo["POSTRES"] = "POSTRES";
    CategoriaTipo["SANDWICHES"] = "SANDWICHES";
    CategoriaTipo["ENSALADAS"] = "ENSALADAS";
})(CategoriaTipo || (CategoriaTipo = {}));
let Category = class Category {
};
__decorate([
    PrimaryGeneratedColumn({ type: 'bigint' }),
    __metadata("design:type", String)
], Category.prototype, "id", void 0);
__decorate([
    Column({ name: 'tenant_id', type: 'bigint' }),
    __metadata("design:type", String)
], Category.prototype, "tenantId", void 0);
__decorate([
    Column({ name: 'nombre', length: 100 }),
    __metadata("design:type", String)
], Category.prototype, "name", void 0);
__decorate([
    Column({ name: 'slug', length: 100 }),
    __metadata("design:type", String)
], Category.prototype, "slug", void 0);
__decorate([
    Column({
        name: 'tipo_categoria',
        type: 'enum',
        enum: CategoriaTipo,
        enumName: 'categoria_tipo_enum',
    }),
    __metadata("design:type", String)
], Category.prototype, "type", void 0);
Category = __decorate([
    Entity({ name: 'categoria' })
], Category);
export { Category };
