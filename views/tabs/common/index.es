import _ from "lodash";
import React from "react";
import {connect} from "react-redux";
import {createSelector} from "reselect";
import {t} from "../../i18n";
import styled from "styled-components";

import {Tooltip} from "views/components/etc/overlay";
import FA from "react-fontawesome"
import {constSelector, pluginSettingsSelector, pluginResourceSelector} from "../../../redux/selectors";
import {EXTENSION_KEY} from "../../constants";
import {
    FURNITURE_COIN_CAP,
    FURNITURE_BOX_VALUES,
    calculateFurnitureBoxPlan,
    findOverallRecommendation,
} from "../../lib/furniture-calculator";

const $Tab = styled.div`
    .furniture-summary {
        margin: 4px;
        padding: 5px 8px;
        border-left: 3px solid #0f9960;
        background: rgba(15, 153, 96, 0.1);
        line-height: 18px;

        &.warning {
            border-left-color: #d9822b;
            background: rgba(217, 130, 43, 0.12);
        }
    }

    .useItem-list {
        display: flex;
        flex-flow: row wrap;
    
        height: 100%;
    
        .item {
            display: flex;
            flex-flow: row nowrap;
    
            @media screen and (min-width: 471px) {
                flex: 0 1 calc((100% / 2) - 8px);
            }
            @media screen and (min-width: 761px) {
                flex: 0 1 calc((100% / 3) - 8px);
            }
            flex: 0 1 calc(100% - 8px);
            margin: 4px;
            background: rgba(0, 0, 0, 0.075);
            overflow-x: hidden;
    
            .icon {
                flex-grow: 0;
                flex-shrink: 0;
                align-self: center;
    
                width: 32px;
                height: 32px;
                margin: 0 8px;
    
                img {
                    width: 100%;
                    height: 100%;
                }
            }
    
            .content {
                display: flex;
                flex-flow: column nowrap;
    
                flex: 1 1 0;
                overflow-x: hidden;
    
                .title {
                    @title-height: 26px;
    
                    display: flex;
                    flex-flow: row nowrap;
    
                    flex: 0 0 26px;
                    overflow: hidden;
    
                    .title-name {
                        flex: 1 1 0;
                        line-height: 26px;
                        text-align: left;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                        overflow: hidden;
                    }
    
                    .favourite {
                        flex-grow: 0;
                        flex-shrink: 0;
                        cursor: pointer;
                        margin-right: 8px;
                        padding-top: 2px;
    
                        &.active {
                            color: #137CBD;
                        }
                    }
                }
    
                .amount {
                    display: flex;
                    flex-flow: row nowrap;
    
                    flex: 1 0 0;
    
                    & > div:first-child {
                        flex: 1 1 50%;
                    }
    
                    .amount-item, .bp3-popover-wrapper {
                        flex: 1 0 50%;
                    }
    
                    .bp3-popover-target {
                        width: 100%;
                        height: 100%;
                    }
    
                    .amount-item-content {
                        display: flex;
                        flex-flow: row nowrap;
    
                        text-align: left;
    
                        .amount-icon {
                            display: flex;
    
                            margin-top: calc(4px / 2 - 1px);
                            margin-right: 2px;
                            width: 14px;
                            height: 14px;
    
                            img {
                                width: 100%;
                                height: 100%;
                            }
                        }
    
                        .amount-value {
                            line-height: 18px;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            white-space: nowrap;

                            &.safe {
                                color: #0a6640;
                                font-weight: 600;
                            }

                            &.warning {
                                color: #a85400;
                                font-weight: 600;
                            }
                        }
                    }
                }
            }
        }
    }

    .bp3-dark & {
        .item {
            background: rgba(0, 0, 0, 0.25);
        }

        .amount-value.safe {
            color: #66d9a6;
        }

        .amount-value.warning {
            color: #ffbf69;
        }
    }
`;

//region ExtraInfoFurniture
class ExtraInfoFurniture {
    static $tooltip = styled.table`
        border-collapse: collapse;
        min-width: 430px;

        caption {
            padding-bottom: 6px;
            text-align: left;
            font-weight: 600;

            .reference {
                margin-top: 2px;
                font-weight: 400;
                opacity: 0.85;
            }
        }

        th, td {
            padding: 3px 7px;
            text-align: right;
            white-space: nowrap;
        }

        th:first-child, td:first-child {
            text-align: left;
        }

        tbody tr.safe {
            color: #0a6640;
        }

        tbody tr.unsafe {
            color: #b91c1c;
        }

        tbody tr.unavailable {
            color: #59636b;
        }

        tbody tr.recommended {
            background: rgba(15, 153, 96, 0.14);
            font-weight: 700;
        }

        .bp3-dark & {
            tbody tr.safe {
                color: #66d9a6;
            }

            tbody tr.unsafe {
                color: #ffa8a8;
            }

            tbody tr.unavailable {
                color: #b7c4ce;
            }

            tbody tr.recommended {
                background: rgba(102, 217, 166, 0.16);
            }
        }
    `;
    singleValue = 0;
    iconPath = "resource.icons.useItems.common_itemicons_id_44";

    constructor(singleValue) {
        this.singleValue = singleValue;
    }

    format(value) {
        return Number(value).toLocaleString();
    }

    optionName(option) {
        return t(`tabs.common.furnitureSupport.options.${option.id}`);
    }

    createTooltip(plan) {
        const balance = plan.currentCoins == null
            ? t("tabs.common.furnitureSupport.balanceUnavailable")
            : t("tabs.common.furnitureSupport.balance", {
                current: this.format(plan.currentCoins),
                cap: this.format(plan.cap),
            });

        return (
            <ExtraInfoFurniture.$tooltip>
                <caption>
                    <div>{balance}</div>
                    <div className="reference">
                        {t("tabs.common.furnitureSupport.perUnit", {value: this.format(plan.coinValue)})}
                    </div>
                </caption>
                <thead>
                <tr>
                    <th>{t("tabs.common.furnitureSupport.columns.option")}</th>
                    <th>{t("tabs.common.furnitureSupport.columns.boxes")}</th>
                    <th>{t("tabs.common.furnitureSupport.columns.gain")}</th>
                    <th>{t("tabs.common.furnitureSupport.columns.after")}</th>
                    <th>{t("tabs.common.furnitureSupport.columns.discarded")}</th>
                </tr>
                </thead>
                <tbody>
                {plan.options.map(option => {
                    const isRecommended = plan.recommendation?.id === option.id;
                    const className = [
                        option.available ? (option.safe == null ? "unknown" : (option.safe ? "safe" : "unsafe")) : "unavailable",
                        isRecommended ? "recommended" : "",
                    ].join(" ");
                    return (
                        <tr key={option.id} className={className}>
                            <td>
                                {this.optionName(option)}
                                {isRecommended ? ` ${t("tabs.common.furnitureSupport.recommendedBadge")}` : ""}
                            </td>
                            <td>{option.available ? this.format(option.count) : "—"}</td>
                            <td>{option.available ? `+${this.format(option.gain)}` : "—"}</td>
                            <td>{option.after == null ? "—" : this.format(option.after)}</td>
                            <td>{option.discarded == null ? "—" : this.format(option.discarded)}</td>
                        </tr>
                    );
                })}
                </tbody>
            </ExtraInfoFurniture.$tooltip>
        );
    }

    fn(itemData, currentCoins) {
        const plan = calculateFurnitureBoxPlan({
            stock: itemData.raw.item.api_count,
            coinValue: this.singleValue,
            currentCoins,
        });

        let value;
        let statusClass;
        if (plan.currentCoins == null) {
            value = t("tabs.common.furnitureSupport.balanceUnavailableShort");
            statusClass = "warning";
        } else if (plan.recommendation) {
            value = t("tabs.common.furnitureSupport.recommendedShort", {
                count: plan.recommendation.count,
                gain: this.format(plan.recommendation.gain),
            });
            statusClass = "safe";
        } else {
            value = t("tabs.common.furnitureSupport.consumeFirstShort");
            statusClass = "warning";
        }

        itemData.amount.push({
            id: "furniture-support",
            icon: props => _.get(props, this.iconPath),
            prefix: "",
            value,
            statusClass,
            tooltip: this.createTooltip(plan),
        });
        itemData.furniturePlan = plan;

        return itemData;
    }
}

const extraInfoExceptObj = {except: true};
const extraInfo = {
    //region except
    79: extraInfoExceptObj,
    81: extraInfoExceptObj,
    82: extraInfoExceptObj,
    83: extraInfoExceptObj,
    84: extraInfoExceptObj,
    //endregion

    10: new ExtraInfoFurniture(FURNITURE_BOX_VALUES[10]),
    11: new ExtraInfoFurniture(FURNITURE_BOX_VALUES[11]),
    12: new ExtraInfoFurniture(FURNITURE_BOX_VALUES[12]),
};
//endregion

const pluginSettingsTabCommonUseItemsFavouritesSelector = createSelector([pluginSettingsSelector], settings => settings?.tabs?.common?.useItemsFavourites ?? []);
const useItemsSelector = state => state?.info?.useitems;
const furnitureCoinValueSelector = state => state?.info?.basic?.api_fcoin;
const furnitureCoinSelector = createSelector([furnitureCoinValueSelector], value => {
    if (value == null || value === "")
        return null;
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : null;
});
const selector = createSelector(
    [constSelector, useItemsSelector, pluginResourceSelector, pluginSettingsTabCommonUseItemsFavouritesSelector, furnitureCoinSelector],
    (constData, rawUseItems, resource, useItemsFavourites, furnitureCoins) => {
        const useItems = _.orderBy(_.filter(_.map(rawUseItems, item => {
            if (!item)
                return;
            let extra = extraInfo[item.api_id];
            let info = _.get(constData, `$useitems.${item.api_id}`);
            if (!info || extra?.except)
                return;

            let sort = useItemsFavourites.indexOf(item.api_id);
            if (sort === -1)
                sort = null;

            let itemData = {
                id: item.api_id,
                name: t(`translate.useItems.${item.api_id}`, null, info.api_name),
                isFavourite: sort != null,
                sort,
                amount: [{
                    value: item.api_count ?? 0
                }],

                raw: {item, info},
            };
            if (extra)
                itemData = extra.fn(itemData, furnitureCoins);

            return itemData;
        })), ["sort", "id"], ["asc", "asc"]);
        const furniturePlans = useItems
            .filter(item => item.furniturePlan)
            .map(item => ({boxId: item.id, boxName: item.name, plan: item.furniturePlan}));

        return {
            resource,
            useItems,
            furnitureCoins,
            hasFurnitureBoxes: furniturePlans.length > 0,
            overallRecommendation: findOverallRecommendation(furniturePlans),
        };
    }
);
const mapStateToProps = state => selector(state);
const mapDispatchToProps = dispatch => ({
    switchUseItemsFavourite: (direction, id) => dispatch({type: `@@${EXTENSION_KEY}@common-switchUseItemsFavourite`, direction, id}),
});

const AmountItem = function (props) {
    return (
        <div className="amount-item-content">
            <div className="amount-icon">
                <img src={(props.amountItem.icon && props.amountItem.icon(props.componentProps)) ?? props.componentProps.resource?.others?.port_skin_1_22}/>
            </div>
            <div className={`amount-value ${props.amountItem.statusClass ?? ""}`}>
                {props.amountItem.prefix ?? "x"}{props.amountItem.value ?? 0}
            </div>
        </div>
    );
};

const FurnitureSummary = function (props) {
    if (!props.hasFurnitureBoxes)
        return null;

    let content;
    let warning = false;
    if (props.furnitureCoins == null) {
        content = t("tabs.common.furnitureSupport.balanceUnavailable");
        warning = true;
    } else if (!props.overallRecommendation) {
        content = t("tabs.common.furnitureSupport.consumeFirst");
        warning = true;
    } else {
        const {boxName, option} = props.overallRecommendation;
        content = t("tabs.common.furnitureSupport.overall", {
            current: Number(props.furnitureCoins).toLocaleString(),
            cap: FURNITURE_COIN_CAP.toLocaleString(),
            box: boxName,
            option: t(`tabs.common.furnitureSupport.options.${option.id}`, {number: option.count}),
            gain: Number(option.gain).toLocaleString(),
            after: Number(option.after).toLocaleString(),
        });
    }

    return <div className={`furniture-summary ${warning ? "warning" : ""}`}>{content}</div>;
};

const tab = connect(mapStateToProps, mapDispatchToProps)(function (props) {
    return (
        <$Tab>
            <FurnitureSummary {...props}/>
            <div className="useItem-list">
                {
                    props.useItems.map(item =>
                        <div key={item.id} className="item">
                            <div className="icon">
                                <img src={_.get(props.resource?.icons?.useItems, `common_itemicons_id_${item.id}`)}/>
                            </div>
                            <div className="content">
                                <div className="title">
                                    <div className="title-name" title={item.name}>{item.name}</div>
                                    {
                                        item.isFavourite ?
                                            <div className="favourite active" title={t("tabs.common.favouriteButton.undo")} onClick={() => props.switchUseItemsFavourite("remove", item.id)}>
                                                <FA name="star"></FA>
                                            </div>
                                            :
                                            <div className="favourite" title={t("tabs.common.favouriteButton.text")} onClick={() => props.switchUseItemsFavourite("add", item.id)}>
                                                <FA name="star-o"></FA>
                                            </div>
                                    }
                                </div>
                                <div className="amount">
                                    {
                                        item.amount.map((amountItem, index) =>
                                            amountItem.tooltip ?
                                                <Tooltip key={amountItem.id ?? index} wrapperTagName="div" targetTagName="div" content={amountItem.tooltip} lazy={true}>
                                                    <AmountItem componentProps={props} amountItem={amountItem}/>
                                                </Tooltip>
                                                :
                                                <div key={amountItem.id ?? index} className="amount-item">
                                                    <AmountItem componentProps={props} amountItem={amountItem}/>
                                                </div>
                                        )
                                    }
                                </div>
                            </div>
                        </div>
                    )
                }
            </div>
        </$Tab>
    )
});

export default {
    id: "common",
    title: t("root.tabs.common"),
    panel: tab,
}
