/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  GoogleGenerativeAIError,
  GoogleGenerativeAIRequestInputError,
} from "./errors";
import { CachedContent, ModelParams, RequestOptions } from "../types";
import { GenerativeModel } from "./models/generative-model";
import { ImageModel } from "./models/image-model";

export { ChatSession } from "./methods/chat-session";
export { GenerativeModel };

/**
 * Top-level class for this SDK
 * @public
 */
export class GoogleGenerativeAI {
  constructor(public apiKey: string) {}

  /**
   * Gets a {@link GenerativeModel} instance for the provided model name.
   */
  getGenerativeModel(
    modelParams: ModelParams,
    requestOptions?: RequestOptions,
  ): GenerativeModel {
    if (!modelParams.model) {
      throw new GoogleGenerativeAIError(
        `Must provide a model name. ` +
          `Example: genai.getGenerativeModel({ model: 'my-model-name' })`,
      );
    }
    return new GenerativeModel(this.apiKey, modelParams, requestOptions);
  }

  getImageModel(
    modelParams: ModelParams,
    requestOptions?: RequestOptions,
  ): ImageModel {
    if (!modelParams.model) {
      throw new GoogleGenerativeAIError(
        `Must provide a model name. ` +
          `Example: genai.getGenerativeModel({ model: 'my-model-name' })`,
      );
    }
    return new ImageModel(this.apiKey, modelParams, requestOptions);
  }


  /**
   * Creates a {@link GenerativeModel} instance from provided content cache.
   */
  getGenerativeModelFromCachedContent(
    cachedContent: CachedContent,
    modelParams?: Partial<ModelParams>,
    requestOptions?: RequestOptions,
  ): GenerativeModel {
    if (!cachedContent.name) {
      throw new GoogleGenerativeAIRequestInputError(
        "Cached content must contain a `name` field.",
      );
    }
    if (!cachedContent.model) {
      throw new GoogleGenerativeAIRequestInputError(
        "Cached content must contain a `model` field.",
      );
    }

    /**
     * Not checking tools and toolConfig for now as it would require a deep
     * equality comparison and isn't likely to be a common case.
     */
    const disallowedDuplicates: Array<keyof ModelParams & keyof CachedContent> =
      ["model", "systemInstruction"];

    for (const key of disallowedDuplicates) {
      if (
        modelParams?.[key] &&
        cachedContent[key] &&
        modelParams?.[key] !== cachedContent[key]
      ) {
        if (key === "model") {
          const modelParamsComp = modelParams.model.startsWith("models/")
            ? modelParams.model.replace("models/", "")
            : modelParams.model;
          const cachedContentComp = cachedContent.model.startsWith("models/")
            ? cachedContent.model.replace("models/", "")
            : cachedContent.model;
          if (modelParamsComp === cachedContentComp) {
            continue;
          }
        }
        throw new GoogleGenerativeAIRequestInputError(
          `Different value for "${key}" specified in modelParams` +
            ` (${modelParams[key]}) and cachedContent (${cachedContent[key]})`,
        );
      }
    }

    const modelParamsFromCache: ModelParams = {
      ...modelParams,
      model: cachedContent.model,
      tools: cachedContent.tools,
      toolConfig: cachedContent.toolConfig,
      systemInstruction: cachedContent.systemInstruction,
      cachedContent,
    };
    return new GenerativeModel(
      this.apiKey,
      modelParamsFromCache,
      requestOptions,
    );
  }
}
