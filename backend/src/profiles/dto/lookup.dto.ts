import { IsString } from 'class-validator';

export class LookupDto {
  @IsString()
  riotName: string;

  @IsString()
  tag: string;
}
