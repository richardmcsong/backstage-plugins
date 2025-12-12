/*
 * Copyright 2025 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { TypedResponse } from '../schema/openapi/generated/apis/Api.client';

/**
 * Handles a response from the API, returning the body for success statuses
 * and throwing a formatted error for failure statuses.
 *
 * @param response - The `TypedResponse` from a generated API client call.
 * @returns The JSON body of the response.
 * @throws An `Error` with a descriptive message if the response status is 400 or greater.
 */
export async function handleApiResponse<T>(
  response: TypedResponse<T>,
): Promise<T> {
  const body = await response.json();

  if (response.status >= 400) {
    const message =
      (body as { message?: string })?.message ??
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return body;
}
