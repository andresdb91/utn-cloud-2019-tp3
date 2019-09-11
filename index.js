var AWS = require('aws-sdk');
var uuid = require('node-uuid');

var handler = function (event, context, callback) {
    var dynamodb = new AWS.DynamoDB({
        apiVersion: '2012-08-10',
        endpoint: 'http://dynamodb:8000',
        region: 'us-west-2',
        credentials: {
            accessKeyId: 'asd',
            secretAccessKey: 'asd'
        }
    });

    var docClient = new AWS.DynamoDB.DocumentClient({
        apiVersion: '2012-08-10',
        service: dynamodb
    });


    // Codigo lambda
    let id = (event.pathParameters || {}).idEnvio || false;
    let reqBody = JSON.parse(event.body || "{}");
    //console.log(event.body)

    switch(event.httpMethod) {
        case "GET":
            if (id) {
                // Ver envio por id
                var params_ver_envio = {
                    TableName: 'Envios',
                    Key: {
                        id: id,
                    },
                };

                docClient.get(params_ver_envio, function(err, data) {
                    if (err) callback(null, {body: "Error: " + err});
                    else callback(null, {body: JSON.stringify(data)});
                });
                return;
            }

            // Ver envios pendientes
            let params_pendientes = {
                TableName: 'Envios',
                IndexName: 'EnviosPendientesIndex',
            };

            docClient.scan(params_pendientes, function(err, data) {
                if (err) callback(null, {body: "Error: " + err});
                else callback(null, {body: JSON.stringify(data)});
            });
            break;

        case "POST":
            if (id) {
                // Marcar entregado
                var params_marcar_entregado = {
                    TableName: 'Envios',
                    Key: {
                        id: id,
                    },
                    UpdateExpression: 'REMOVE pendiente',
                };

                docClient.update(params_marcar_entregado, function(err, data) {
                    if (err) callback(null, {body: "Error: " + err});
                    else callback(null, {body: "Envio entregado: " + id});
                });
                return;
            }

            // Crear envio
            destino = reqBody.destino;
            email = reqBody.email;
            if (!(destino || email)) {
                callback(null, {body: "Error: Faltan parametros requeridos"});
                return;
            }
            let fechaAlta = new Date().toISOString();
            let params = {
                TableName: 'Envios',
                Item: {
                    id: uuid.v1(),
                    fechaAlta: fechaAlta,
                    destino: destino,
                    email: email,
                    pendiente: "X",
                },
            };
            docClient.put(params, function(err, data) {
                if (err) callback(null, {body: "Error al intentar crear el envio: " + err});
                else callback(null, {body: "Envio creado: " + fechaAlta});
            });
            break;
     }
};

exports.handler = handler;

