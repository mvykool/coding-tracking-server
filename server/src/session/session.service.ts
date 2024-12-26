import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Session } from '../schemas/session.schema';

@Injectable()
export class SessionsService {
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<Session>,
  ) {}

  async create(session: any) {
    const newSession = new this.sessionModel(session);
    return newSession.save();
  }

  async getDailyStats() {
    return this.sessionModel.aggregate([
      {
        $group: {
          _id: {
            date: '$date',
            file_type: '$file_type',
          },
          total_duration: { $sum: '$duration' },
        },
      },
      {
        $group: {
          _id: '$_id.date',
          file_types: {
            $push: {
              type: '$_id.file_type',
              duration: '$total_duration',
            },
          },
          total_duration: { $sum: '$total_duration' },
        },
      },
      { $sort: { _id: -1 } },
    ]);
  }
}
