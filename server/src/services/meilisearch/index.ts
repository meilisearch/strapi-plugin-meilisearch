import type { Core } from "@strapi/strapi";
import { meilisearchAdapterService } from "./adapter"
import { meilisearchConfigService } from "./config";
import { meilisearchConnectorService } from "./connector";


  const meilisearchService = ({ strapi }: { strapi: Core.Strapi }) => {
	const adapter = meilisearchAdapterService({ strapi })
	const config = meilisearchConfigService({ strapi })
	return {
		...meilisearchConfigService({ strapi }),
		...meilisearchConnectorService({ strapi, adapter, config }),
		...meilisearchAdapterService({ strapi }),
	  }
  }

  export default meilisearchService;