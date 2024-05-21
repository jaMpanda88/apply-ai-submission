const { get } = require('http');
const predictClassification = require('../services/inferenceService');
const storeData = require('../services/storeData');
const { Firestore } = require('@google-cloud/firestore');
const crypto = require('crypto');
const { data } = require('@tensorflow/tfjs-node');

async function postPredictHandler(request, h) {
    const { image } = request.payload;
    const { model } = request.server.app;

    const {confidenceScore, label, suggestion} = await predictClassification(model, image);
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    const data = {
        "id": id,
        "result": label,
        "suggestion": suggestion,
        "createdAt": createdAt
    }

    const response = h.response({
        status: 'success',
        message: confidenceScore > 99.50 ? 'Model is predicted successfully' : 'Model is predicted successfully but under threshold. Please use the correct picture',
        data
    })

    response.code(201);
    await storeData(id, data);
    return response;
}

const firestore = new Firestore();

const getPredictHandler = async (_request, h) => {
    try {
        const histories = [];
        const snapshot = await firestore.collection('predictions').get();
        
        snapshot.forEach(doc => {
            histories.push(doc.data());
        });
        
        const formattedHistories = histories.map(history => ({
            id: history.id,
            history: {
                result: history.result,
                createdAt: history.createdAt,
                suggestion: history.suggestion,
                id: history.id
            }
        }));

        return h.response({
            status: 'success',
            data: formattedHistories
        }).code(200);
    } catch (error) {
        return h.response({
            status: 'fail',
            message: error.message
        }).code(500);
    }
};

module.exports = {postPredictHandler, getPredictHandler};