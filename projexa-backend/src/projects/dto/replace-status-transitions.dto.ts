import { ArrayMinSize, IsArray, IsInt, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class StatusTransitionEdgeDto {
  @IsInt()
  fromStatusId: number;

  @IsInt()
  toStatusId: number;
}

export class ReplaceStatusTransitionsDto {
  @IsArray()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => StatusTransitionEdgeDto)
  edges: StatusTransitionEdgeDto[];
}
