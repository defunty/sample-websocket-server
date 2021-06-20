# command
```
# start redis
docker-compose up -d

# start server
yarn start

```
# 利用ライブラリ
## ioredis
https://github.com/luin/ioredis
node.js用redisクライアント。
redisクライアントではnode_redisがメジャーだが、promiseの利用が外部ライブラリ依存となるため、primiseを利用できるioredisを採用。
