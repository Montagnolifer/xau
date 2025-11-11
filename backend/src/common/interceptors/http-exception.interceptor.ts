import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message = exception.message;
    let details: string[] | null = null;

    // Tratar erros de validação
    if (status === HttpStatus.BAD_REQUEST) {
      if (typeof exceptionResponse === 'object' && 'message' in exceptionResponse) {
        if (Array.isArray(exceptionResponse.message)) {
          message = 'Erro de validação';
          details = exceptionResponse.message as string[];
        } else {
          message = exceptionResponse.message as string;
        }
      }
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: message,
      details: details,
      error: exceptionResponse,
    };

    response.status(status).json(errorResponse);
  }
} 