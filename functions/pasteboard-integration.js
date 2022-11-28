const emptyConfig = Object.freeze({});

async function handleViewerConfigurationRequest({
    viewer,
    state,
    displays,
    boards,
    screenshots,
    deleteFieldValue
}) {

    const [accountId, displayId] = Buffer.from(viewer, "base64").toString().split("_");

    const ref = displays.doc(accountId).collection("data").doc(displayId);

    // update
    ref.set({ ping: Date.now(), state }, { merge: true });

    // fetch
    const snapshot = await ref.get();
    const display = snapshot.data();

    // notify
    if (!(display.board === state.board && display.version === state.version)) {

        if (display.board) {

            const boardRef = boards.doc(accountId).collection("data").doc(display.board);
            const boardSnapshot = await boardRef.get();
            display.data = boardSnapshot.exists && boardSnapshot.data();
            display.version = boardSnapshot.exists && boardSnapshot.updateTime.valueOf();

        } else {

            display.data = null;

        }

    }
    if (display.screenshotRequest) {

        const uploadFile = screenshots.file(`screenshots/${display.screenshotRequest.toString()}`);
        const exists = await uploadFile.exists();
        const metadata = exists[0] && await uploadFile.exists() && await uploadFile.getMetadata();
        if (metadata && (metadata[0].size > 10)) {

            await ref.set({ screenshotRequest: deleteFieldValue }, { merge: true });
            delete display.screenshotRequest;

        }

    }
    if (display.screenshotRequest !== state.screenshotRequest) {

        if (display.screenshotRequest) {

            const uploadFile = screenshots.file(`screenshots/${display.screenshotRequest.toString()}`);
            await uploadFile.save("");
            await uploadFile.makePublic();
            const urls = await uploadFile.getSignedUrl({
                version: 'v4',
                action: 'write',
                expires: Date.now() + 30 * 60 * 1000, // 30 mins
                "Content-Type": "text/html"
            });
            display.upload = urls[0];

        }

    }
    return display;

}


async function handleBoardChange({ accountId, boardId, change, boards, displays, logger }) {

    const displaysRef = displays.doc(accountId);
    const displaysSnapshot = await displaysRef.get();

    const beforeName = change.before.data()?.name;
    const afterName = change.after.data()?.name;
    if (beforeName !== afterName) {

        await boards.doc(accountId).collection("metadata").doc(boardId).set({
            id: boardId,
            name: afterName
        });

    }
    if (displaysSnapshot.exists) {

        const displayPatch = {
            board: boardId,
            version: displaysSnapshot.updateTime.valueOf()
        };

        const displayIdsToUpdate = Object
            .entries(displaysSnapshot.data() || {})
            .filter(([, displayConfig]) => displayConfig.board === boardId)
            .map(([displayId]) => displayId);

        const patch = Object.fromEntries(displayIdsToUpdate.map(id => [id, displayPatch]));

        logger.debug("Updating displays for board", { boardId, patch });
        await displaysRef.set(patch, { merge: true });

    }

}

async function refreshDisplaysEntitlement({ displays, accountId, entitlements }) {
    const countSnapshot = await displays.doc(accountId).collection("data").count().get();
    const actual = countSnapshot.data()?.count || 0;
    await entitlements.doc(accountId).set({ displays: { actual } }, { merge: true });
}

exports.handleViewerConfigurationRequest = handleViewerConfigurationRequest;
exports.handleBoardChange = handleBoardChange;
exports.refreshDisplaysEntitlement = refreshDisplaysEntitlement;