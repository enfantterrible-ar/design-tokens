import { config } from './config';
import { saveTokens } from './helpers';
import { resolveConfig } from './resolver';
import { toDTCG } from './transformers';

const resolvedConfig = resolveConfig(config);
const dtcg = toDTCG(resolvedConfig);

saveTokens(dtcg, 'build/tokens.primitives.json');