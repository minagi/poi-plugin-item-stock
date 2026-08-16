import React from "react";
import styled from "styled-components";

import commonTab from "./tabs/common/index";

const $container = styled.div`
    width: 100%;
    height: 100%;
    
    #plugin-mountpoint & {
        padding: 4px;
        
        .bp3-dark & {
            background: #30404d;
        }
    }
`;

export default function () {
    const Panel = commonTab.panel;

    return (
        <$container>
            <Panel/>
        </$container>
    );
}
