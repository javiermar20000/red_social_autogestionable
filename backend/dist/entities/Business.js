var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
export var NegocioTipo;
(function (NegocioTipo) {
    NegocioTipo["RESTAURANTE"] = "RESTAURANTE";
    NegocioTipo["CAFETERIA"] = "CAFETERIA";
    NegocioTipo["BAR"] = "BAR";
    NegocioTipo["FOODTRUCK"] = "FOODTRUCK";
})(NegocioTipo || (NegocioTipo = {}));
export var NegocioRangoPrecio;
(function (NegocioRangoPrecio) {
    NegocioRangoPrecio["BAJO"] = "BAJO";
    NegocioRangoPrecio["MEDIO"] = "MEDIO";
    NegocioRangoPrecio["ALTO"] = "ALTO";
})(NegocioRangoPrecio || (NegocioRangoPrecio = {}));
export var NegocioEstado;
(function (NegocioEstado) {
    NegocioEstado["ACTIVO"] = "ACTIVO";
    NegocioEstado["INACTIVO"] = "INACTIVO";
})(NegocioEstado || (NegocioEstado = {}));
let Business = class Business {
};
__decorate([
    PrimaryGeneratedColumn({ type: 'bigint' }),
    __metadata("design:type", String)
], Business.prototype, "id", void 0);
__decorate([
    Column({ name: 'tenant_id', type: 'bigint' }),
    __metadata("design:type", String)
], Business.prototype, "tenantId", void 0);
__decorate([
    Column({ name: 'owner_id', type: 'bigint' }),
    __metadata("design:type", String)
], Business.prototype, "ownerId", void 0);
__decorate([
    Column({ name: 'nombre', length: 255 }),
    __metadata("design:type", String)
], Business.prototype, "name", void 0);
__decorate([
    Column({ name: 'tipo', type: 'enum', enum: NegocioTipo, enumName: 'negocio_tipo_enum' }),
    __metadata("design:type", String)
], Business.prototype, "type", void 0);
__decorate([
    Column({ name: 'descripcion', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Business.prototype, "description", void 0);
__decorate([
    Column({ name: 'direccion', length: 255, nullable: true }),
    __metadata("design:type", String)
], Business.prototype, "address", void 0);
__decorate([
    Column({ name: 'ciudad', length: 100, nullable: true }),
    __metadata("design:type", String)
], Business.prototype, "city", void 0);
__decorate([
    Column({ name: 'region', length: 100, nullable: true }),
    __metadata("design:type", String)
], Business.prototype, "region", void 0);
__decorate([
    Column({
        name: 'rango_precios',
        type: 'enum',
        enum: NegocioRangoPrecio,
        enumName: 'negocio_rango_precios_enum',
        nullable: true,
    }),
    __metadata("design:type", String)
], Business.prototype, "priceRange", void 0);
__decorate([
    Column({ name: 'latitud', type: 'decimal', precision: 9, scale: 6, nullable: true }),
    __metadata("design:type", String)
], Business.prototype, "latitude", void 0);
__decorate([
    Column({ name: 'longitud', type: 'decimal', precision: 9, scale: 6, nullable: true }),
    __metadata("design:type", String)
], Business.prototype, "longitude", void 0);
__decorate([
    Column({ name: 'estado', type: 'enum', enum: NegocioEstado, enumName: 'negocio_estado_enum', default: NegocioEstado.INACTIVO }),
    __metadata("design:type", String)
], Business.prototype, "status", void 0);
__decorate([
    CreateDateColumn({ name: 'fecha_creacion', type: 'timestamptz' }),
    __metadata("design:type", Date)
], Business.prototype, "createdAt", void 0);
Business = __decorate([
    Entity({ name: 'negocio' })
], Business);
export { Business };
