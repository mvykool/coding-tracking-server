import {
  Controller,
  Post,
  Get,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { SessionsService } from './session.service';
import { CreateSessionDto, DailyStats, Session } from './sessions.dto';

@Controller('api')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  private convertToEasternTime(timestamp: number): Date {
    // Create a date object from the Unix timestamp
    const date = new Date(timestamp * 1000);

    // Convert to Eastern Time
    const easternDate = new Date(
      date.toLocaleString('en-US', {
        timeZone: 'America/New_York',
      }),
    );

    return easternDate;
  }

  private formatEasternDate(timestamp: number): string {
    const date = new Date(timestamp * 1000);

    // Get Eastern Time date components
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });

    return formatter.format(date);
  }

  @Post('track')
  async createSession(
    @Body() body: CreateSessionDto,
  ): Promise<{ status: string }> {
    try {
      // Format the date using the start timestamp directly
      const dateStr = this.formatEasternDate(body.start_time);

      const session: Session = {
        file_type: body.file_type,
        start_time: new Date(body.start_time * 1000), // Store as UTC
        end_time: new Date(body.end_time * 1000), // Store as UTC
        duration: body.duration,
        date: dateStr, // Store formatted Eastern Time date
      };

      // Validation checks
      if (session.end_time <= session.start_time) {
        throw new HttpException(
          'End time must be after start time',
          HttpStatus.BAD_REQUEST,
        );
      }

      const calculatedDuration =
        (session.end_time.getTime() - session.start_time.getTime()) / 1000;

      if (Math.abs(calculatedDuration - body.duration) > 1) {
        throw new HttpException(
          'Duration does not match time difference',
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.sessionsService.create(session);
      return { status: 'success' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to create session',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stats/daily')
  async getDailyStats(): Promise<DailyStats[]> {
    try {
      return await this.sessionsService.getDailyStats();
    } catch (error) {
      throw new HttpException(
        'Failed to fetch daily stats: ' + error,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
