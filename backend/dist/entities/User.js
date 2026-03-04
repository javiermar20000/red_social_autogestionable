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
export var RolUsuario;
(function (RolUsuario) {
    RolUsuario["OFERENTE"] = "OFERENTE";
    RolUsuario["VISITANTE"] = "VISITANTE";
})(RolUsuario || (RolUsuario = {}));
export var EstadoRegistroUsuario;
(function (EstadoRegistroUsuario) {
    EstadoRegistroUsuario["PENDIENTE_VALIDACION"] = "PENDIENTE_VALIDACION";
    EstadoRegistroUsuario["ACTIVO"] = "ACTIVO";
    EstadoRegistroUsuario["BLOQUEADO"] = "BLOQUEADO";
    EstadoRegistroUsuario["RECHAZADO"] = "RECHAZADO";
})(EstadoRegistroUsuario || (EstadoRegistroUsuario = {}));
let User = class User {
};
__decorate([
    PrimaryGeneratedColumn({ type: 'bigint' }),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    Column({ name: 'tenant_id', type: 'bigint', nullable: true }),
    __metadata("design:type", String)
], User.prototype, "tenantId", void 0);
__decorate([
    Column({ unique: true }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    Column({ name: 'password_hash' }),
    __metadata("design:type", String)
], User.prototype, "passwordHash", void 0);
__decorate([
    Column({ length: 150 }),
    __metadata("design:type", String)
], User.prototype, "nombre", void 0);
__decorate([
    Column({
        name: 'rol_usuario',
        type: 'enum',
        enum: RolUsuario,
        enumName: 'rol_usuario_enum',
        default: RolUsuario.VISITANTE,
    }),
    __metadata("design:type", String)
], User.prototype, "rol", void 0);
__decorate([
    Column({
        name: 'estado_registro',
        type: 'enum',
        enum: EstadoRegistroUsuario,
        enumName: 'usuario_estado_registro_enum',
        default: EstadoRegistroUsuario.PENDIENTE_VALIDACION,
    }),
    __metadata("design:type", String)
], User.prototype, "estadoRegistro", void 0);
__decorate([
    CreateDateColumn({ name: 'fecha_registro', type: 'timestamptz' }),
    __metadata("design:type", Date)
], User.prototype, "fechaRegistro", void 0);
__decorate([
    Column({ name: 'fecha_validacion', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], User.prototype, "fechaValidacion", void 0);
__decorate([
    Column({ default: true }),
    __metadata("design:type", Boolean)
], User.prototype, "activo", void 0);
User = __decorate([
    Entity({ name: 'usuario' })
], User);
export { User };
