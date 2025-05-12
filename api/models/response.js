class Response {
    constructor() {
        this.status = false;
        this.code = 400;
        this.message = "";
        this.data = null;
    }

    success(code, message, data = null) {
        this.status = true;
        this.code = code;
        this.message = message;
        this.data = data;
        return this;
    }

    failure(code, message, error = null) {
        this.status = false;
        this.code = code;
        this.message = message;
        if (error) this.error = error;
        return this;
    }
}

module.exports = Response;