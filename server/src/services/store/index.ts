import type { Core } from "@strapi/strapi";
import storeStoreService from "./store";
import storeCredentialService from "./credential";
import storeListenedContentTypesService from "./listened-content-types";
import storeIndexedContentTypesService from "./indexed-content-types";

const storeService = ({ strapi }: { strapi: Core.Strapi }) => {
	const store = storeStoreService({ strapi});
	return {
		...storeCredentialService({ store, strapi }),
		...storeListenedContentTypesService({ store }),
		...storeIndexedContentTypesService({ store }),
		...storeStoreService({ strapi }),
	  }
}

export default storeService;