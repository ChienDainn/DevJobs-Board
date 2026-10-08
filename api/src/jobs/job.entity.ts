import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Khoá chống trùng: link bài gốc, hoặc "tiêu đề|công ty" nếu không có link */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 600 })
  externalId: string;

  @Column({ type: 'varchar', length: 300 })
  title: string;

  @Column({ type: 'varchar', length: 200, default: '' })
  company: string;

  @Column({ type: 'varchar', length: 200, default: '' })
  location: string;

  @Column({ type: 'varchar', length: 200, default: '' })
  salary: string;

  @Column('simple-json')
  tech: string[];

  @Column({ type: 'varchar', length: 600, default: '' })
  url: string;

  @Column({ type: 'varchar', length: 300, default: '' })
  contact: string;

  /** Nguồn: tên group Facebook, Remotive, Arbeitnow, "Facebook (dán)", "Thủ công" */
  @Column({ type: 'varchar', length: 200, default: '' })
  source: string;

  @Column({ type: 'varchar', length: 100, default: '' })
  postedAt: string;

  @Column({ type: 'text', default: '' })
  note: string;

  @Column({ type: 'text', default: '' })
  description: string;

  /** Cột trên bảng: 0 Mới, 1 Quan tâm, 2 Đã ib/ứng tuyển, 3 Phỏng vấn, 4 Offer, 5 Bỏ qua */
  @Column({ type: 'int', default: 0 })
  col: number;

  @Column({ type: 'int', default: 0 })
  position: number;

  @CreateDateColumn()
  createdAt: Date;
}
