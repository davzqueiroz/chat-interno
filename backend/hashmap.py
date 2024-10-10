class HashMap:
    store = {}

    def get(self,key):
        if key in self.store:
            return self.store[key]
        else: return None

    def set(self,key,value):
        self.store[key] = value
        return self.store[key]

    def delete(self, key):
        self.store.pop(key, None)

    def has(self, key):
        return key in self.store

    def get_connections_name(self):
        nomes_online = []
        for chave in self.store:
            nomes_online.append(self.get(chave)['nome'])
        return nomes_online

    def get_id_by_sid(self, sid):
        for cliente in self.store:
            if self.store.get(cliente)['sid'] == sid:
                return cliente
