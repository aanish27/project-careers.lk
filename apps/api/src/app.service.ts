import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getData(): {
    data: {
      id: number;
      name: string;
    };
    metadata: {
      total: number;
      next_page: number;
      size: number;
    };
  } {
    return {
      data: {
        id: 1,
        name: 'hello',
      },
      metadata: {
        total: 1,
        next_page: 1,
        size: 10,
      },
    };
  }
}
