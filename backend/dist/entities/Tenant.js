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
export var TenantEstado;
(function (TenantEstado) {
    TenantEstado["PENDIENTE_VALIDACION"] = "PENDIENTE_VALIDACION";
    TenantEstado["ACTIVO"] = "ACTIVO";
    TenantEstado["SUSPENDIDO"] = "SUSPENDIDO";
    TenantEstado["RECHAZADO"] = "RECHAZADO";
})(TenantEstado || (TenantEstado = {}));
let Tenant = class Tenant {
};
__decorate([
    PrimaryGeneratedColumn({ type: 'bigint' }),
    __metadata("design:type", String)
], Tenant.prototype, "id", void 0);
__decorate([
    Column({ length: 255 }),
    __metadata("design:type", String)
], Tenant.prototype, "nombre", void 0);
__decorate([
    Column({ length: 255, nullable: true }),
    __metadata("design:type", String)
], Tenant.prototype, "dominio", void 0);
__decorate([
    Column({
        name: 'estado',
        type: 'enum',
        enum: TenantEstado,
        enumName: 'tenant_estado_enum',
        default: TenantEstado.PENDIENTE_VALIDACION,
    }),
    __metadata("design:type", String)
], Tenant.prototype, "estado", void 0);
__decorate([
    CreateDateColumn({ name: 'fecha_creacion', type: 'timestamptz' }),
    __metadata("design:type", Date)
], Tenant.prototype, "fechaCreacion", void 0);
__decorate([
    Column({ name: 'creador_oferente_id', type: 'bigint' }),
    __metadata("design:type", String)
], Tenant.prototype, "creadorOferenteId", void 0);
__decorate([
    Column({ name: 'validador_admin_id', type: 'bigint', nullable: true }),
    __metadata("design:type", String)
], Tenant.prototype, "validadorAdminId", void 0);
Tenant = __decorate([
    Entity({ name: 'tenant' })
], Tenant);
export { Tenant };
