import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { TaskType } from '../enums/task-type.enum';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  description?: string | null;

  @IsEnum(TaskType)
  type: TaskType;

  @IsInt()
  statusId: number;

  @IsOptional()
  @IsInt()
  categoryId?: number | null;

  @IsOptional()
  @IsInt()
  parentId?: number | null;

  @IsOptional()
  @IsInt()
  assigneeId?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
