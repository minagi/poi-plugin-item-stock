import _ from "lodash";
import {createSelector} from "reselect";

import {EXTENSION_KEY} from "../views/constants";
import {pluginSettingsSelector, pluginSettingsSet} from "./selectors";
import {debugConsole} from "../views/lib/debug/index";

const pluginSettingsTabCommonUseItemsFavouritesSelector = createSelector([pluginSettingsSelector], settings => settings?.tabs?.common?.useItemsFavourites ?? []);

export default (state = {}, action, store) => {
    const {type} = action;

    debugConsole().log(`on action "${type}"`);

    if (type === `@@${EXTENSION_KEY}@__update__`) {
        return {
            ...state,
            ...action.data,
        };
    }

    if (type === `@@${EXTENSION_KEY}@common-switchUseItemsFavourite`) {
        let {direction, id} = action;

        let array = pluginSettingsTabCommonUseItemsFavouritesSelector(store);
        switch (direction) {
            case "add":
                array = [
                    ...array,
                    id,
                ];
                break;
            case "remove":
                array = [
                    ..._.filter(array, value => value !== id),
                ];
                break;
        }

        pluginSettingsSet("tabs.common.useItemsFavourites", array);

        return {
            ...state,
        };
    }

    return state
}
