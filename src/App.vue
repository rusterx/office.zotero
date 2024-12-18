<template>
  <div id="app">
    <button class="btn btn-primary btn-run" @click="run">运行</button>
    <div v-for="(ctn, i) in citations" :key="i" class="ctn-panel" ref="ctnViews">
      <h3>{{ ctn['citation'] }}</h3>
      <ul>
        <li v-for="(bib, j) in ctn['bibliography']" :key="j">
          <a :href="ctn['uris'][j]" target="_blank" title="打开Zotero项目">
            <i class="bi bi-diagram-2 text-danger"></i>
          </a>
          <i class="bi bi-box-fill text-danger px-1" @click.prevent="copyId(i, j)" title="复制ID"></i>
          <span>{{ bib }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>


<script setup name="App">

import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { Cite } from '@citation-js/core';
import '@citation-js/plugin-doi'
import '@citation-js/plugin-csl';

const citations = ref([]);
const ctnViews = ref([]);
var plainCitations = [];

onMounted(async () => {
  // 默认会运行一次
  run();
  // 监听事件
  Office.context.document.addHandlerAsync(Office.EventType.DocumentSelectionChanged, onSelectedChange);
});


onUnmounted(() => {
  Office.context.document.removeHandlerAsync(Office.EventType.DocumentSelectionChanged, onSelectedChange);
});


async function copyId(i, j) {
  var ctnKey = citations.value[i]['keys'][j];
  navigator.clipboard.writeText(ctnKey);
}


async function onSelectedChange(e) {
  await Word.run(async (context) => {
    const selection = context.document.getSelection();
    selection.load(['text', 'fields', 'parentBody', 'isEmpty']);
    await context.sync();

    // 此种方法可以得到当前光标所在的段落，但是无法得到当前段落的field
    const currentParagraph = selection.paragraphs.getFirstOrNullObject()
    const contentRange = selection.expandToOrNullObject(currentParagraph.getRange(Word.RangeLocation.end));
    contentRange.load(['text', 'fields', 'parentBody', 'isEmpty']);
    await context.sync();

    const fields = contentRange.fields;
    fields.load(['items']);
    await context.sync();

    // fields大于0
    if (fields.items.length > 0) {
      const field = fields.items[0];
      field.load(["code", "result", "locked", "type", "data", "kind"]);
      await context.sync();

      if (field.type == 'Addin' && field.code.includes('ZOTERO_ITEM')) {
        // console.log("Range of result: " + field.result['text']);
        var fieldText = field.result['text'];
        var startIndex = contentRange.text.indexOf(fieldText);

        // 防止误触发，如果找不到，或者找到的距离太远都不会变化
        if (startIndex == -1 || startIndex > 5) {
          return;
        }

        // 找不到field的引用
        var index = plainCitations.indexOf(fieldText);
        if (index == -1) {
          console.log("找不到引用");
          run();
          return;
        }

        await nextTick();
        ctnViews.value[index].scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }

    // 移动到当前段落

    // console.log(contentRange.fields);
  });
}

async function run() {
  await Word.run(async (context) => {
    const fields = context.document.body.fields;
    fields.load(['items']);
    await context.sync();

    // 清楚citations
    citations.value = [];
    plainCitations = [];

    for (let i = 0; i < fields.items.length; i++) {
      const field = fields.items[i];
      field.load(["code", "result", "locked", "type", "data", "kind"]);
      await context.sync();
      var ctn = {
        'citation': '',
        'bibliography': [],
        'uris': [],
        'keys': []
      }
      if (field.type == 'Addin' && field.code.includes('ZOTERO_ITEM')) {
        var code = field.code.replace('ADDIN ZOTERO_ITEM CSL_CITATION ', '').trim();
        var jsCode = JSON.parse(code);
        console.log(jsCode);
        // console.log("JS Code: " + code);
        // console.log("Range of result " + i + ": " + field.result['text']);

        // citation
        ctn['citation'] = jsCode['properties']['plainCitation'];
        plainCitations.push(jsCode['properties']['plainCitation']);

        // bibliography
        var citationItems = jsCode['citationItems']
        for (let j = 0; j < citationItems.length; j++) {
          var citationItem = citationItems[j];

          // 解析bibliography
          var itemData = citationItem['itemData'];
          var cite = new Cite(itemData);
          var bibliography = cite.format('bibliography', {
            format: 'text',
            template: 'apa'
          });
          ctn['bibliography'].push(bibliography);

          // 解析URL
          var uris = citationItem['uris'];
          var baseName =new URL(uris).pathname.split('/').pop();
          var zoteroUrl = `zotero://select/library/items/${baseName}`;
          console.log("Zotero URL: " + zoteroUrl);
          ctn['uris'].push(zoteroUrl);

          // 引用键值
          ctn['keys'].push(itemData['citation-key']);
        }

        // push citation to citations
        citations.value.push(ctn);
      }
    }
  });
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  /* margin-top: 5px; */
  padding: 5px;
  padding-top: 10px;
}

.btn-run {
  margin-bottom: 5px;
}

.ctn-panel {
  padding: 5px;
  margin-bottom: 10px;
  border-radius: 5px;
  background-color: #f5f5f5;
  text-align: left;
  word-wrap: break-word;
  line-break: auto;
}
</style>
