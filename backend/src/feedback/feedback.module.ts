import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedbackController } from './feedback.controller';
import { FeedbackApiController } from './feedback.api.controller';
import { FeedbackService } from './feedback.service';
import { Feedback } from './entities/feedback.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Feedback])],
    controllers: [FeedbackController, FeedbackApiController],
    providers: [FeedbackService],
    exports: [FeedbackService],
})
export class FeedbackModule {}
