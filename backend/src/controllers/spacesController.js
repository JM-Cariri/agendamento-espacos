import { asyncHandler } from '../utils/http.js';
import { parseSpaceId, validateSpace } from '../validators/spacesValidator.js';
import { validateSpaceFilters } from '../validators/filtersValidator.js';
import * as spaces from '../services/spaceService.js';

export const listSpaces = asyncHandler(async (req, res) => res.json(await spaces.listSpaces(validateSpaceFilters(req.query))));
export const getSpace = asyncHandler(async (req, res) => res.json(await spaces.getSpace(parseSpaceId(req.params.id))));
export const createSpace = asyncHandler(async (req, res) => res.status(201).json(await spaces.createSpace(validateSpace(req.body))));
export const updateSpace = asyncHandler(async (req, res) => res.json(await spaces.updateSpace(parseSpaceId(req.params.id), validateSpace(req.body, true))));
export const archiveSpace = asyncHandler(async (req, res) => res.json(await spaces.archiveSpace(parseSpaceId(req.params.id))));
