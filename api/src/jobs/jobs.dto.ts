import { PartialType } from '@nestjs/mapped-types';
import { ArrayMaxSize, IsArray, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateJobDto {
  @IsString() @MinLength(1) @MaxLength(300)
  title: string;

  @IsOptional() @IsString() @MaxLength(200)
  company?: string;

  @IsOptional() @IsString() @MaxLength(200)
  location?: string;

  @IsOptional() @IsString() @MaxLength(200)
  salary?: string;

  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsString({ each: true }) @MaxLength(40, { each: true })
  tech?: string[];

  @IsOptional() @IsString() @MaxLength(600)
  url?: string;

  @IsOptional() @IsString() @MaxLength(300)
  contact?: string;

  @IsOptional() @IsString() @MaxLength(200)
  source?: string;

  @IsOptional() @IsString() @MaxLength(100)
  postedAt?: string;

  @IsOptional() @IsString() @MaxLength(10_000)
  note?: string;

  @IsOptional() @IsString() @MaxLength(30_000)
  description?: string;

  /** Cột ban đầu (mặc định 0 = Mới) */
  @IsOptional() @IsInt() @Min(0) @Max(5)
  col?: number;
}

/** Sửa thông tin job. Đổi cột/thứ tự dùng POST /jobs/:id/move. */
export class UpdateJobDto extends PartialType(CreateJobDto) {}

export class MoveJobDto {
  @IsInt() @Min(0) @Max(5)
  col: number;

  /** Vị trí trong cột đích (0 = đầu cột) */
  @IsInt() @Min(0)
  index: number;
}
