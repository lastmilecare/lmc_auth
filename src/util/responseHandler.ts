import { Response } from 'express';
import HttpStatusCode from '../const/HttpStatusCode';

function formatResponse(
  status: boolean,
  code: number,
  data: any = null,
  message = '',
) {
  return {
    status,
    code,
    data,
    message,
  };
}

function sendSuccess(
  res: Response,
  code: number,
  data: any = null,
  message = 'Success',
) {
  return res
    .status(HttpStatusCode.OK.code)
    .json(formatResponse(true, code, data, message));
}

function sendError(
  res: Response,
  code: number,
  message: any,
) {
  return res
    .status(code)
    .json(formatResponse(false, code, null, message));
}

export { sendSuccess, sendError };
