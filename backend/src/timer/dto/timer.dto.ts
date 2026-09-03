import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class StartTimerDto {
  @IsOptional()
  @IsInt({ message: 'Durasi harus berupa bilangan bulat' })
  @Min(10, { message: 'Durasi minimal 10 detik' })
  @Max(7200, { message: 'Durasi maksimal 120 menit (7200 detik)' })
  duration?: number;
}

export class UpdateDurationDto {
  @IsInt({ message: 'Durasi harus berupa bilangan bulat' })
  @Min(10, { message: 'Durasi minimal 10 detik' })
  @Max(7200, { message: 'Durasi maksimal 120 menit (7200 detik)' })
  duration: number;
}
