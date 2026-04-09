import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Activation } from './activation.entity';

@Entity({ name: 'promocode' })
@Index('promocode_created_at_idx', ['createdAt'])
@Index('promocode_updated_at_idx', ['updatedAt'])
@Index('promocode_valid_until_idx', ['validUntil'])
@Index('promocode_discount_idx', ['discount'])
@Index('promocode_activation_limit_idx', ['activationLimit'])
@Check('promocode_discount_check', '"discount" BETWEEN 1 AND 100')
@Check(
  'promocode_activation_limit_check',
  '"activation_limit" IS NULL OR "activation_limit" >= 0',
)
@Check('promocode_activation_count_check', '"activation_count" >= 0')
@Check(
  'promocode_activation_consistency_check',
  '"activation_limit" IS NULL OR "activation_count" <= "activation_limit"',
)
export class Promocode {
  @PrimaryColumn({ type: 'varchar', length: 15 })
  code: string;

  @Column({ type: 'smallint' })
  discount: number;

  @Column({ name: 'activation_limit', type: 'integer', nullable: true })
  activationLimit: number | null;

  @Column({ name: 'activation_count', type: 'integer', default: 0 })
  activationCount: number;

  @Column({
    name: 'valid_until',
    type: 'timestamptz',
    nullable: true,
  })
  validUntil: Date | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @OneToMany(() => Activation, (activation) => activation.promocode)
  activations: Activation[];
}
