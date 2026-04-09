import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Promocode } from './promocode.entity';

@Entity({ name: 'activation' })
@Unique('activation_email_promocode_unique', ['code', 'email'])
export class Activation {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ name: 'promocode_code', type: 'varchar', length: 15 })
  code: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @ManyToOne(() => Promocode, (promocode) => promocode.activations, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({
    name: 'promocode_code',
    referencedColumnName: 'code',
    foreignKeyConstraintName: 'activation_promocode_fk',
  })
  promocode: Promocode;
}
