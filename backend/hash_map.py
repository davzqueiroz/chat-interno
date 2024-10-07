class Hash_map:
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

    def get_all(self):
        return self.store

