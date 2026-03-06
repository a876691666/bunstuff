<script setup lang="ts">
import { useRouter } from 'vue-router'
import { definePage } from 'vue-router/experimental'

definePage({ meta: { layout: 'full' } })

const router = useRouter()
</script>

<template>
  <div class="h-full overflow-auto bg-white dark:bg-dark">
    <div class="max-w-4xl mx-auto px-6 py-12">
      <div class="flex items-center mb-8">
        <n-button text @click="router.back()">
          <template #icon>
            <div class="i-carbon-arrow-left text-lg" />
          </template>
          返回
        </n-button>
      </div>

      <n-h1>服务条款</n-h1>
      <n-text depth="3" class="text-sm">最后更新日期：2026年3月6日</n-text>

      <n-divider />

      <div class="flex flex-col gap-6 text-sm leading-7">
        <section>
          <n-h3>1. 服务协议的接受</n-h3>
          <n-text depth="2">
            欢迎使用 Platform（以下简称"本平台"）。在使用本平台提供的任何服务之前，请您仔细阅读本服务条款（以下简称"本条款"）。当您注册、登录或以任何方式使用本平台服务时，即表示您已阅读、理解并同意接受本条款的全部内容。如果您不同意本条款的任何内容，请立即停止使用本平台的服务。
          </n-text>
        </section>

        <section>
          <n-h3>2. 服务内容</n-h3>
          <n-text depth="2">
            本平台为用户提供在线服务，包括但不限于数据管理、信息展示、文件存储等功能。本平台有权随时对服务内容进行调整、更新或终止，并将通过适当方式通知用户。
          </n-text>
        </section>

        <section>
          <n-h3>3. 用户账号</n-h3>
          <n-text depth="2">
            您在注册账号时应提供真实、准确、完整的信息，并在信息发生变更时及时更新。您应妥善保管账号和密码，因账号密码泄露所导致的一切损失由您自行承担。您不得将账号转让、出借或以其他方式提供给第三方使用。
          </n-text>
        </section>

        <section>
          <n-h3>4. 用户行为规范</n-h3>
          <n-text depth="2">
            您在使用本平台服务时，应遵守中华人民共和国相关法律法规，不得利用本平台从事违法违规活动，包括但不限于：发布违法信息、侵犯他人知识产权、恶意攻击系统、干扰其他用户正常使用等行为。
          </n-text>
        </section>

        <section>
          <n-h3>5. 知识产权</n-h3>
          <n-text depth="2">
            本平台上的所有内容，包括但不限于文字、图片、软件、代码、界面设计等，均受知识产权法律法规的保护。未经本平台书面授权，任何人不得以任何方式复制、修改、传播或使用上述内容。
          </n-text>
        </section>

        <section>
          <n-h3>6. 免责声明</n-h3>
          <n-text depth="2">
            本平台将尽力确保服务的稳定运行，但不对因不可抗力、系统维护、网络故障等原因导致的服务中断或数据丢失承担责任。本平台对用户上传的内容不承担审核义务，因用户行为导致的一切后果由用户自行承担。
          </n-text>
        </section>

        <section>
          <n-h3>7. 隐私保护</n-h3>
          <n-text depth="2">
            本平台重视用户隐私保护，具体请参阅我们的
            <n-button text type="primary" size="tiny" @click="router.push('/privacy')">隐私政策</n-button>
            。
          </n-text>
        </section>

        <section>
          <n-h3>8. 条款修改</n-h3>
          <n-text depth="2">
            本平台有权根据需要不时修改本条款。修改后的条款将在本平台公布，公布之日起即生效。如您在条款修改后继续使用本平台服务，即视为您已接受修改后的条款。
          </n-text>
        </section>

        <section>
          <n-h3>9. 适用法律与争议解决</n-h3>
          <n-text depth="2">
            本条款的订立、执行和解释均适用中华人民共和国法律。因本条款引起的或与本条款有关的任何争议，双方应友好协商解决；协商不成的，应提交有管辖权的人民法院解决。
          </n-text>
        </section>

        <section>
          <n-h3>10. 联系我们</n-h3>
          <n-text depth="2">
            如果您对本服务条款有任何疑问，请通过本平台提供的联系方式与我们取得联系。
          </n-text>
        </section>
      </div>
    </div>
  </div>
</template>
